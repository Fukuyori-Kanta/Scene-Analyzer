import tensorflow as tf
import tensorflow_hub as hub
import numpy as np
from PIL import Image
import time
import os
from logging import getLogger, StreamHandler, DEBUG

from file_io import write_csv

# プロキシ設定
#os.environ["https_proxy"] = "http://wwwproxy.kanazawa-it.ac.jp:8080"

# モジュールのキャッシュ設定
os.environ ["TFHUB_CACHE_DIR"] = r'C:\Users\fukuyori\AppData\Local\Temp\tfhub_modules'

# ログ設定
logger = getLogger(__name__)
handler = StreamHandler()
handler.setLevel(DEBUG)
logger.setLevel(DEBUG)
logger.addHandler(handler)
logger.propagate = False

# tensorflowのバージョン表示
print(tf.version.VERSION)

# 使用出来るGPUを表示
print("The following GPU devices are available: %s" % tf.test.gpu_device_name())

def run_detector(detector, path):
  # 画像を読み込んで detector に入力できる形式に変換
  img = Image.open(path) # Pillow(PIL)
  if img.mode == 'RGBA' :
    img = img.convert('RGB')
  converted_img = img.copy()
  converted_img = converted_img.resize((227,227),Image.LANCZOS) # 入力サイズに縮小
  converted_img = np.array(converted_img, dtype=np.float32)     # np.arrayに変換
  converted_img = converted_img / 255. # 0.0 ～ 1.0 に正規化
  converted_img = converted_img.reshape([1,227,227,3])
  converted_img = tf.constant(converted_img)

  t1 = time.time()
  result = detector(converted_img) # 一般物体検出（本体）
  t2 = time.time()
  print(f'検出時間 : {t2-t1:.3f} 秒' )

  # 結果をテキスト出力するための準備
  r = {key:value.numpy() for key,value in result.items()}
  boxes =       r['detection_boxes']
  scores =      r['detection_scores']
  decode = np.frompyfunc( lambda p : p.decode('ascii'), 1, 1)
  class_names = decode( r['detection_class_entities'] )

  label = []    # 付与されたラベル
  # スコアが 0.25 以上の結果（n件）についてテキスト出力
  #print(f'検出オブジェクト' )
  n = np.count_nonzero(scores >= 0.25 )
  for i in range(n):
    y1, x1, y2, x2 = tuple(boxes[i])
    x1, x2 = int(x1*img.width), int(x2*img.width)
    y1, y2 = int(y1*img.height),int(y2*img.height)
    t = f'{class_names[i]:10} {100*scores[i]:3.0f}%  '
    t += f'({x1:>4},{y1:>4}) - ({x2:>4},{y2:>4})'
    print(t)
    label.append(class_names[i] + '(' + str(round(100*scores[i], 2)) + '%)')

  return label

def object_recognition(result_cut_img_path, result_noun_path):
    # --------------------------------------------------
    # 動画IDリストの作成
    # --------------------------------------------------
    video_id_list = os.listdir(result_cut_img_path)  # 動画ファイル名（動画ID）一覧を取得
    
    # --------------------------------------------------
    # 学習済みモジュールの読み込み
    # --------------------------------------------------
    print('モジュールの読み込み中...')
    # モジュールの読み込み
    #module_handle = "https://tfhub.dev/google/faster_rcnn/openimages_v4/inception_resnet_v2/1"
    module_handle = "https://tfhub.dev/google/openimages_v4/ssd/mobilenet_v2/1"
    detector = hub.load(module_handle).signatures['default']
    print('モジュール読み込み完了')
    # TODO 読み取りエラーの例外処理追加

    # --------------------------------------------------
    # 物体認識によるラベル付け
    # --------------------------------------------------
    label_result = []   # 最終結果用のラベルリスト
    for video_id in video_id_list:
        print('==========')
        print(video_id)
        print('==========')
        cut_img_path = result_cut_img_path + '\\' + video_id # 保存先パス

        # ファイルの読み込み
        files = os.listdir(cut_img_path)
        label_list = []     # ラベルのリスト

        for i in range(len(files)):
            path = cut_img_path + '\\cut_img' + str(i+1) + '.jpg'  # カットのパス
            print(path)
            cut_no = 'cut_' + str(i+1)  # カット番号
            print('[' + cut_no + ']')

            # 物体検出・認識
            label = run_detector(detector, path)            # 検出結果のラベル
            label_list.append([video_id, cut_no, label])    # [動画ID, カット番号, ラベルリスト]

            print('-----------------')
        label_result.append(label_list)
    print(label_result)

    # CSVファイルにラベリング結果を書き出し
    write_csv(label_result, result_noun_path)