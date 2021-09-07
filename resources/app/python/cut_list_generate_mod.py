import os
from pathlib import Path
import shutil
from natsort import natsorted
from file_io import dest_folder_create

# Cut_List, cut_videosを作成する
# Cut_List : カット（動画）を1つにまとめたフォルダ
# cut_videos : Cut_Listの動画名をまとめたテキストデータ
def cut_list_generate(result_cut_path, cut_videos_path, cut_list_path):
    # [Cut_List]の作成
    dest_folder_create(cut_list_path)

    # [cut_videos]の作成
    cut_videos_file = Path(cut_videos_path)
    cut_videos_file.touch(exist_ok=True)
    f = open(cut_videos_file, 'w')

    # 動画IDリストの作成
    video_id_list = os.listdir(result_cut_path)   # 動画IDリスト

    for video_id in video_id_list:
        videos_path = os.path.normpath(os.path.join(result_cut_path, video_id)) # カット動画フォルダのパス
        videos = natsorted(os.listdir(videos_path)) # カット動画リスト（自然順）
        for video in videos:

            new_file_name = video_id + '_' + video  # 新規ファイル名

            video_path = os.path.normpath(os.path.join(videos_path, video)) # カット動画のパス
            new_video_path = os.path.normpath(os.path.join(cut_list_path, new_file_name))   # 新規の保存先（Cut_List）

            # [cut_videos]に書き込み
            f.write(new_file_name + '\n')
            
            # [Cut_List]にコピー
            shutil.copyfile(video_path, new_video_path)
            
    f.close()