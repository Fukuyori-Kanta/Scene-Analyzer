import random
import os
import ast
import re
import numpy as np
import mysql.connector
# pipでインストール
# conda install  mysql-connector-python

from file_io import read_csv

def connection_to_db(target_db):
    # データベースに接続
    db=mysql.connector.connect(
        host="localhost", 
        user="root", 
        password="password", 
        auth_plugin='mysql_native_password' # パスワードの認証プラグインを
    )

    cursor=db.cursor()
    
    # データベースを選択
    cursor.execute("USE %s" % target_db)
    db.commit()

    return db, cursor

def delete_table(db, cursor, table_name):
    cursor.execute("""DROP TABLE IF EXISTS %s""" % table_name)
    db.commit()

def get_within_parenthesis(s):
    return int(re.findall("(?<=\().+?(?=\))", s)[0])

def remove_parenthesis(s):
    return re.sub("\(.+?\)", "" , s)

if __name__ == "__main__":
    # --------------------------------------------------
    # データの読み込み、データの加工
    # --------------------------------------------------
    # パス設定
    #base = os.path.dirname(os.path.abspath(__file__))   # スクリプト実行ディレクトリ
    scene_path = r'C:\Users\fukuyori\Scene-Analyzer\resources\app\python\temp\result_favo.csv'   # シーン動画の保存先
    
    # 場面データの読み込み
    result_data_ALL = read_csv(scene_path, True)  

    # 動画IDリストの作成
    video_id_list = [['demo60']]  # 一覧から拡張子を削除
    
    # ラベルIDのイテレータを作成
    start_ID = 90000 # ID開始値（初期120CM = 1000、1000CM = 2000）
    label_id_list = [start_ID + x for x in range(1, start_ID, 1)]
    label_id = iter(label_id_list)

    # スコアIDのイテレータを作成
    score_id_list = ['A' + str(start_ID + x) for x in range(1, start_ID, 1)]
    score_id = iter(score_id_list)

    # 格納するデータ
    scene_data = []     # シーンデータ      [video_id, scene_no, labels_id, labels_count]
    labels_data = []    # ラベルデータ      [video_id, labels_id, no, label, count]
    
    for result_data in result_data_ALL:
        video_id = result_data[0]   # 動画ID
        scene_no = result_data[1]   # シーン番号
        favo_value = result_data[5] # 好感度
        labels_id = next(label_id)  # ラベルID
        labels = ast.literal_eval(result_data[4])   # ラベルのリスト
        labels_count = len(labels)  # ラベルカウント

        # シーンデータに格納
        scene_data.append([video_id, scene_no, favo_value, labels_id, labels_count])

        # ラベルデータに格納（ラベル数()を除いてから）
        for i in range(labels_count):
            labels_data.append([labels_id, i+1, labels[i], 1])


    works_data = [['demo60', '東京企画', 'CM総合研究所', 'デモ用']]

    access_history = []    
    time = random.randrange(60)
    access_history.append([video_id, '2020-1-1 00:00:' + str(time)])

    # --------------------------------------------------
    # DBに格納
    # --------------------------------------------------
    target_db = 'analysis_db'   # 格納するデータベース

    # データベースに接続
    db, cursor = connection_to_db(target_db)
    
    # シーンデータを挿入
    insert_data = "INSERT INTO scene_data (video_id, scene_no, favo_value, labels_id, labels_count) VALUES (%s, %s, %s, %s, %s);"
    
    for sd in scene_data:
        cursor.execute(insert_data, sd)
    db.commit()

    # ラベルデータを挿入
    insert_data = "INSERT INTO labels_data (labels_id, no, label, count) VALUES (%s, %s, %s, %s);"

    for ld in labels_data:
        cursor.execute(insert_data, ld)
    db.commit()
    
    # アクセスデータを挿入
    insert_data = "INSERT INTO access_history (video_id, last_access_time) VALUES (%s, %s);"
    
    for ah in access_history:
        cursor.execute(insert_data, ah)
    db.commit()

    # 作品データを挿入
    insert_data = "INSERT INTO works_data (video_id, company_name, brand_name, product_name) VALUES (%s, %s, %s, %s);"
    
    for wd in works_data:
        cursor.execute(insert_data, wd)
    db.commit()