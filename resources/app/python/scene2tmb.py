import cv2
import os

from file_io import dest_folder_create

def save_thumbnail_img(input_video_path, result_thumbnail_path, scene):
    """
    動画を読み込み、フレームデータと動画情報を抽出する関数

    Parameters
    ----------
    input_video_path : str
        動画の入力パス   

    Returns
    -------
    frames : numpy.ndarray
        フレームデータ（動画の全画像データ）
    
    video_info : list 
        動画データ [fps, width, height]
    """
    # --------------------------------------------------
    # 動画の読み込み
    # --------------------------------------------------
    input_video_path = input_video_path + '\\' + scene   # 入力動画パス
    cap = cv2.VideoCapture(input_video_path)

    # ビデオキャプチャーが開けていない場合、例外を返す
    if cap.isOpened() is False:
        raise ValueError('読み込みエラー : 動画ID ' + input_video_path + 'が上手く読み取れません。')
    
    fps = cap.get(cv2.CAP_PROP_FPS)                 # FPS
    width = cap.get(cv2.CAP_PROP_FRAME_WIDTH)       # 幅
    height = cap.get(cv2.CAP_PROP_FRAME_HEIGHT)     # 高さ
    frame_count = cap.get(cv2.CAP_PROP_FRAME_COUNT) # 総フレーム数
    sec = frame_count / fps                         # 秒数
    
    # --------------------------------------------------
    # フレーム毎の画像情報をリストに格納
    # --------------------------------------------------
    n_frames = int(frame_count) # 総フレーム数 
    frames = []
    while True:
        ret, frame = cap.read()
        # 最後まで取得出来なかった場合、そこまでを総フレームとして更新
        if not ret:
            #n_frames = int(cap.get(cv2.CAP_PROP_POS_FRAMES))
            break

        frames.append(frame)
        if len(frames) == n_frames:
            break

    if cap.isOpened():
        cap.release()   

    # サムネ画像の保存    
    index = scene.split('scene')[1].split('.mp4')[0]
    cv2.imwrite(result_thumbnail_path + '\\thumbnail' + index + '.jpg', frames[-1])

    cv2.destroyAllWindows()


base = os.path.dirname(os.path.abspath(__file__))   # スクリプト実行ディレクトリ
scene_path = os.path.normpath(os.path.join(base, r'..\result\scene'))   # シーン動画の保存先
thumbnail_path = os.path.normpath(os.path.join(base, r'..\result\thumbnail')) # サムネイルの保存先

dest_folder_create(thumbnail_path)
video_id_list = os.listdir(scene_path)  # 動画IDリスト

for video_id in video_id_list:
    input_video_path = os.path.normpath(os.path.join(scene_path, video_id)) # 入力動画パス
    result_thumbnail_path = os.path.normpath(os.path.join(thumbnail_path, video_id))    # サムネ結果保存パス

    # サムネ画像の保存フォルダを作成
    dest_folder_create(result_thumbnail_path)

    scene_list = os.listdir(input_video_path)   # シーンリスト

    # サムネ画像を保存
    for scene in scene_list:
        save_thumbnail_img(input_video_path, result_thumbnail_path, scene)
