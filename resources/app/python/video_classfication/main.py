"""
@article{hara3dcnns,
  author={Kensho Hara and Hirokatsu Kataoka and Yutaka Satoh},
  title={Can Spatiotemporal 3D CNNs Retrace the History of 2D CNNs and ImageNet?},
  journal={arXiv preprint},
  volume={arXiv:1711.09577},
  year={2017},
}
"""
import os
import shutil
import sys
import json
import subprocess
import numpy as np
import torch
from torch import nn
import cv2

from opts import parse_opts
from model import generate_model
from mean import get_mean
from classify import classify_video

def is_16frame_or_more(video_path):
    """
    16フレーム以内の動画は動作認識をしない

    """
    # 動画の読み込み
    cap = cv2.VideoCapture(video_path)     

    # ビデオキャプチャーが開けていない場合、例外を返す
    if cap.isOpened() is False:
        raise ValueError('読み込みエラー : ' + video_path + 'が上手く読み取れません。')

    n_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) # 総フレーム数
            
    if n_frames >= 16:
        return True

def action_recognition():
    # pytorch, gpu情報の表示
    print(torch.__version__)
    print(torch.cuda.is_available())
    print(torch.cuda.get_device_name())

    opt = parse_opts()
    opt.mean = get_mean()
    opt.arch = '{}-{}'.format(opt.model_name, opt.model_depth)
    opt.sample_size = 112
    opt.sample_duration = 16
    opt.n_classes = 400
    print('generating model...')
    model = generate_model(opt)
    print('loading model {}'.format(opt.model))
    model_data = torch.load(opt.model)
    assert opt.arch == model_data['arch']
    model.load_state_dict(model_data['state_dict'])
    model.eval()
    if opt.verbose:
        print(model)

    input_files = []
    with open(opt.input, 'r') as f:
        for row in f:
            input_files.append(row[:-1])

    class_names = []
    with open('class_names_list') as f:
        for row in f:
            class_names.append(row[:-1])

    ffmpeg_loglevel = 'quiet'
    if opt.verbose:
        ffmpeg_loglevel = 'info'

    if os.path.exists('tmp'):
        #subprocess.call('rm -rf tmp', shell=True)
        shutil.rmtree('tmp')    # windows用
    outputs = []
    for input_file in input_files:
        video_path = os.path.join(opt.video_root, input_file)
        if os.path.exists(video_path):
            print("========================")
            print(video_path)
            print("========================")
            # 16フレーム以上の時のみ動作認識
            if is_16frame_or_more(video_path):
                subprocess.call('mkdir tmp', shell=True)
                subprocess.call(r'C:\ffmpeg-N-103536-g60515a6d61-win64-gpl-shared\ffmpeg-N-103536-g60515a6d61-win64-gpl-shared\bin\ffmpeg.exe -i {} tmp/image_%05d.jpg'.format(video_path), shell=True)
                #video2images(video2images)
                                
                # コマンド実行になるため、Windows側にffmpegをインストールする必要がある
                # ffmpegの環境変数パス設定しても以下のようなエラーが出たため、
                # 現在はffmpeg.exeのあるパスを直接指定している（今後、アプリ内に入れたりする必要あり）
                # エラー文 : 内部コマンドまたは外部コマンド、 操作可能なプログラムまたはバッチ ファイルとして認識されていません。

                result = classify_video('tmp', input_file, class_names, model, opt)
                outputs.append(result)

                #subprocess.call('rm -rf tmp', shell=True)
                shutil.rmtree('tmp')
        else:
            print('{} does not exist'.format(input_file))

    if os.path.exists('tmp'):
        #subprocess.call('rm -rf tmp', shell=True)
        shutil.rmtree('tmp')

    with open(opt.output, 'w') as f:
        json.dump(outputs, f)

def video2images(video_path, ext='jpg'):
    print(video_path)
    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        return

    base_path = os.path.join('tmp', 'image_')

    digit = len(str(int(cap.get(cv2.CAP_PROP_FRAME_COUNT))))

    n = 1

    while True:
        ret, frame = cap.read()
        if ret:
            cv2.imwrite('{}_{}.{}'.format(base_path, str(n).zfill(digit), ext), frame)
            n += 1
        else:
            return


if __name__ == '__main__':
    action_recognition()