import sys
import os
from cut_segmentation_mod import cut_segmentation
from cut_img_generate_mod import cut_img_generate

files = sys.argv[1]
files = files.split(',')

base = os.path.dirname(os.path.abspath(__file__))   # スクリプト実行ディレクトリ（[main.py] のディレクトリ）
result_cut_path = os.path.normpath(os.path.join(base, 'temp\cut'))     # カットの保存先
result_img_path = os.path.normpath(os.path.join(base, 'temp\cut_img')) # カット画像の保存先

# カット分割
cut_segmentation(files, result_cut_path)
cut_img_generate(files, result_img_path)

print('カット分割が終了しました')
sys.stdout.flush()
