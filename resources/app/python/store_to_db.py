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
    # パス設定
    base = os.path.dirname(os.path.abspath(__file__))   # スクリプト実行ディレクトリ
    scene_path = os.path.normpath(os.path.join(base, r'..\..\..\..\CM_Analysis\Result\Favo\result_data_ALL.csv'))   # シーン動画の保存先
    ranking_path = os.path.normpath(os.path.join(base, r'..\..\..\..\CM_Analysis\Result\Favo\result_data_ALL.csv'))   # ランキングデータの保存先
    works_info_path = os.path.normpath(os.path.join(base, r'..\..\..\..\CM_Analysis\Data\作品情報\MovieList_210428.csv'))   # 作品情報の保存先
    video_path = os.path.normpath(os.path.join(base, r'..\..\..\..\CM_Analysis\Data\Movie'))   # 動画データの保存先

    # 好感要因
    score_category = [['F', '好感度'], ['A', '試用意向'], ['R1', '出演者'], ['R2', 'ユーモラス'], ['R3', 'セクシー'], ['R4', '宣伝文句'], 
                      ['R5', '音楽・サウンド'], ['R6', '商品にひかれた'], ['R7', '説得力に共感'], ['R8', 'ダサいけど憎めない'], ['R9', '時代の先端'], ['R10', '心がなごむ'], 
                      ['R11', 'ストーリー展開'], ['R12', '企業姿勢'], ['R13', '映像・画像'], ['R14', '周囲の評判'], ['R15', 'かわいらしい']]
    
    # 区分（上位，中位，下位）
    kubun_list = ['top', 'mid', 'btm']   

    # 場面データの読み込み
    result_data_ALL = read_csv(scene_path, True)  
    
    # ランキングデータの読み込み
    ranking_data = read_csv(ranking_path)
    
    # 作品情報の読み込み
    works_info = read_csv(works_info_path)

    # 動画IDリストの作成
    files = os.listdir(video_path)  # 動画ファイル名（動画ID）一覧を取得
    video_id_list = [f.replace('.mp4', '') for f in files]  # 一覧から拡張子を削除
    
    # ラベルIDのイテレータを作成
    start_ID = 20000 # ID開始値（初期120CM = 1000、1000CM = 2000）
    label_id_list = [start_ID + x for x in range(1, start_ID, 1)]
    label_id = iter(label_id_list)

    # スコアIDのイテレータを作成
    score_id_list = ['A' + str(start_ID + x) for x in range(1, start_ID, 1)]
    score_id = iter(score_id_list)

    # 行と列を転置
    ranking_data = np.array(ranking_data).T.tolist()

    # 格納するデータ
    scene_data = []     # シーンデータ      [video_id, scene_no, labels_id, labels_count]
    labels_data = []    # ラベルデータ      [video_id, labels_id, no, label, count]
    access_history = [] # アクセスデータ    [video_id, last_access_time]
    rank_data = []      # ランキングデータ  [category, kubun, ranking, label, count, norm]
    works_data = []     # 作品データ        [video_id, company_name, brand_name, product_name]

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

    # ランキングデータに格納　TODO : 列名を削除して CM_analysisのanalysis_mod.pyの修正
    for i in range(17):
        category = score_category[i][0] # カテゴリー（好感要因）
        label_col = ranking_data[i*3]   # ラベル列
        count_col = ranking_data[i*3+1] # 個数列
        norm_col = ranking_data[i*3+2]  # 正規化した値の列

        for j in range(len(kubun_list)):
            kubun = kubun_list[j]   # 区分
            start_row = j*10    # スタートセル
            for k in range(10):
                ranking = k+1
                label = label_col[start_row+k]
                count = count_col[start_row+k]
                norm = norm_col[start_row+k]
                rank_data.append([category, kubun, ranking, label, count, norm])

    # 作品データに格納
    for info in works_info:
        video_id = info[1]
        meta_data = info[2].split('／')
        company_name = meta_data[0]
        brand_name = meta_data[1]
        product_name = meta_data[2]
        works_data.append([video_id, company_name, brand_name, product_name])

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
    

    # ランキングデータの削除
    #db_name = "ranking"
    #cursor.execute("""DROP TABLE %s""" % db_name)
    #db.commit()

    #cursor.execute("""CREATE TABLE IF NOT EXISTS ranking(
    #                category VARCHAR(10),
    #                kubun VARCHAR(30),
    #                ranking INT,
    #                label VARCHAR(30),
    #                count INT,
    #                norm FLOAT);""")
    #db.commit()
    
    # ランキングデータを挿入
    insert_data = "INSERT INTO ranking (category, kubun, ranking, label, count, norm) VALUES (%s, %s, %s, %s, %s, %s);"
    
    for rd in rank_data:
        cursor.execute(insert_data, rd)
    
    db.commit()

    # 作品情報
    # テーブルの作成
    cursor.execute("""CREATE TABLE IF NOT EXISTS works_data(
                    video_id VARCHAR(30),
                    company_name VARCHAR(50),
                    brand_name VARCHAR(50),
                    product_name VARCHAR(50));""")
    db.commit()

    insert_data = "INSERT INTO works_data (video_id, company_name, brand_name, product_name) VALUES (%s, %s, %s, %s);"
    
    for wd in works_data:
        cursor.execute(insert_data, wd)
    
    db.commit()


    # テスト
    file_name = 'A211079487'
    scene_no = 1
    # データを取得
    #cursor.execute("SELECT * FROM scene_data LEFT JOIN labels_data WHERE video_id='" + file_name + "'")
    #cursor.execute("SELECT * FROM scene_data LEFT JOIN access_history ON scene_data.video_id=access_history.video_id WHERE scene_data.video_id='" + file_name + "'")
    #rows = cursor.fetchall()
    """
    # 出力
    for i in rows:
        print(i)
    
    print(len(rows))
    """