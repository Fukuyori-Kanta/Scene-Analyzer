import random
import os
import ast
import re
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

def delete_table(target_db):
    # データベースに接続
    db, cursor = connection_to_db(target_db)

    db_name = "fruits_table"
    cursor.execute("""DROP TABLE %s""" % db_name)

    db.commit()

def create_table(target_db):
    # データベースに接続
    db, cursor = connection_to_db(target_db)

    # テーブルの削除
    delete_table(target_db)

    cursor.execute("""CREATE TABLE CM_data_table(
                    video_id VARCHAR(20),
                    scene_no VARCHAR(20),
                    favo_value FLOAT);""")

    db.commit()

def insert_data(target_db):
    # データベースに接続
    db, cursor = connection_to_db(target_db)
    
    # データを挿入
    insert_fruit = "INSERT INTO fruits_table (fruits, value) VALUES (%s, %s);"
    

    fruit_list = [
        ("apple", 100),
        ("orange", 80),
        ("melon", 500),
        ("pineapple", 700)
    ]
    
    for fruit in fruit_list:
        cursor.execute(insert_fruit, fruit)
    
    db.commit()

def select_data(target_db):
    # データベースに接続
    db, cursor = connection_to_db(target_db)
    
    # データを取得 TODO
    cursor.execute('SELECT * FROM %s')
    rows = cursor.fetchall()
    """
    # 出力
    for i in rows:
        print(i)
    """

def update_data(target_db):
    # データベースに接続
    db, cursor = connection_to_db(target_db)
    
    # データを更新
    cursor.execute('UPDATE fruits_table SET value=1000 WHERE fruits="apple"')
    db.commit()
    
    # データを取得
    cursor.execute('SELECT * FROM fruits_table')
    rows = cursor.fetchall()
    """
    # 出力
    for i in rows:
        print(i)
    """
    return rows

def get_within_parenthesis(s):
    return int(re.findall("(?<=\().+?(?=\))", s)[0])

def remove_parenthesis(s):
    return re.sub("\(.+?\)", "" , s)

if __name__ == "__main__":
    # --------------------------------------------------
    # データの読み込み、データの加工
    # --------------------------------------------------
    base = os.path.dirname(os.path.abspath(__file__))   # スクリプト実行ディレクトリ
    scene_path = os.path.normpath(os.path.join(base, r'..\..\..\..\CM_Analysis\Result\Favo\result_data_ALL.csv'))   # シーン動画の保存先
    
    # 場面データの読み込み
    result_data_ALL = read_csv(scene_path, True)    
    
    # 動画IDリストの作成
    video_path = os.path.normpath(os.path.join(base, r'..\..\..\..\CM_Analysis\Data\Movie'))   # 動画データの保存先
    files = os.listdir(video_path)  # 動画ファイル名（動画ID）一覧を取得
    video_id_list = [f.replace('.mp4', '') for f in files]  # 一覧から拡張子を削除
    
    # ラベルIDのイテレータを作成
    start_ID = 20000 # ID開始値（初期120CM = 1000、1000CM = 2000）
    label_id_list = [start_ID + x for x in range(1, start_ID, 1)]
    label_id = iter(label_id_list)

    # スコアIDのイテレータを作成
    score_id_list = ['A' + str(start_ID + x) for x in range(1, start_ID, 1)]
    score_id = iter(score_id_list)

    # 格納するデータ
    scene_data = []     # シーンデータ     [video_id, scene_no, labels_id, labels_count]
    labels_data = []    # ラベルデータ     [video_id, labels_id, no, label, count]
    access_history = [] # アクセスデータ   [video_id, last_access_time]
    ranking_data = []   # ランキングデータ [video_id, kubun, ranking, label, count]

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
            labels_data.append([labels_id, i+1, remove_parenthesis(labels[i]), get_within_parenthesis(labels[i])])

    # アクセスデータに格納
    for video_id in video_id_list:
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

    file_name = 'A211079487'
    scene_no = 1
    # データを取得
    #cursor.execute("SELECT * FROM scene_data LEFT JOIN labels_data WHERE video_id='" + file_name + "'")
    cursor.execute("SELECT * FROM scene_data LEFT JOIN access_history ON scene_data.video_id=access_history.video_id WHERE scene_data.video_id='" + file_name + "'")
    rows = cursor.fetchall()

    # 出力
    for i in rows:
        print(i)
    
    print(len(rows))
