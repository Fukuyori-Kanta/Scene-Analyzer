import sys
import os
import subprocess

from cut_segmentation_mod import cut_segmentation
from cut_img_generate_mod import cut_img_generate
from object_recognition_mod import object_recognition
from cut_list_generate_mod import cut_list_generate
from label_shaping_mod import label_shaping
from scene_integration_mod import scene_integration

files = sys.argv[1]
files = files.split(',')

# パスの設定
base = os.path.dirname(os.path.abspath(__file__))   # スクリプト実行ディレクトリ（[main.py] のディレクトリ）
result_cut_path = os.path.normpath(os.path.join(base, 'temp\cut'))          # カットの保存先
result_img_path = os.path.normpath(os.path.join(base, 'temp\cut_img'))      # カット画像の保存先
result_noun_path = os.path.normpath(os.path.join(base, 'temp\\noun_label.csv'))   # 物体認識のラベル格納先
result_verv_path = os.path.normpath(os.path.join(base, 'temp\\verb_label.json'))  # 動作認識のラベル格納先
cut_list_path = os.path.normpath(os.path.join(base, 'temp\cut_list'))       # カットリスト（カット動画を１つにまとめたフォルダ）
cut_videos_path = os.path.normpath(os.path.join(base, 'temp\cut_videos.txt')) # カットビデオ（カット動画名１つにまとめたテキストファイル）

# --------------------------------------------------
# カット分割
# --------------------------------------------------
cut_segmentation(files, result_cut_path) # カット分割
cut_img_generate(files, result_img_path) # カット画像の作成

# --------------------------------------------------
# ラベル付け
# --------------------------------------------------
object_recognition(result_img_path, result_noun_path) # 物体認識によるラベル付け
cut_list_generate(result_cut_path, cut_videos_path, cut_list_path) # カットリストの作成

# パスの変更
os.chdir(os.path.normpath(os.path.join(base, "video_classfication")))   # 動作認識スクリプトがあるディレクトリに変更

# 動作認識（コマンド実行）
cmd = 'python main.py --input ..\\temp\\cut_videos.txt --video_root ..\\temp\\cut_list --output ../temp/verb_label.json --model pre_trained_model/resnet-34-kinetics.pth '
out_str = subprocess.run(cmd)

label_shaping() ##### 後で引数指定

# --------------------------------------------------
# シーンの統合
# --------------------------------------------------
scene_integration(files) ##### 後で引数指定

# --------------------------------------------------
# ＣＭ好感度の分析
# --------------------------------------------------

sys.stdout.flush()
