import random
import os
import ast
import re
import numpy as np
import mysql.connector
# pipでインストール
# conda install  mysql-connector-python

from file_io import read_csv

#TODO: file_ioに移行
def read_txt(path):
    with open(path, encoding='utf-8') as f:
        l = [s.strip() for s in f.readlines()]

    return l
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

if __name__ == "__main__":
    # --------------------------------------------------
    # データの読み込み、データの加工
    # --------------------------------------------------
    # パス設定
    base = os.path.dirname(os.path.abspath(__file__))   # スクリプト実行ディレクトリ
    scene_path = os.path.normpath(os.path.join(base, r'..\..\..\..\CM_Analysis\Result\Favo\result_data_ALL.csv'))   # シーン動画の保存先
    ranking_path = os.path.normpath(os.path.join(base, r'..\..\..\..\CM_Analysis\Result\Favo\rank_data_ALL.csv'))   # ランキングデータの保存先
    works_info_path = os.path.normpath(os.path.join(base, r'..\..\..\..\CM_Analysis\Data\作品情報\MovieList_210428.csv'))   # 作品情報の保存先
    video_path = os.path.normpath(os.path.join(base, r'..\..\..\..\CM_Analysis\Data\Movie'))   # 動画データの保存先

    noun_en_path = os.path.normpath(r'C:\Users\fukuyori\CM_Analysis\Data\Label\noun_label(en).txt') # 名詞のラベル群（英語）
    noun_ja_path = os.path.normpath(r'C:\Users\fukuyori\CM_Analysis\Data\Label\noun_label(ja).txt') # 名詞のラベル群（日本語）
    noun_trans_table_path = os.path.normpath(r'C:\Users\fukuyori\CM_Analysis\Data\Label\noun_screening.csv') # スクリーニング用の対応表

    verb_en_path = os.path.normpath(r'C:\Users\fukuyori\CM_Analysis\Data\Label\verb_label(en).txt') # 動詞のラベル群（英語）
    verb_ja_path = os.path.normpath(r'C:\Users\fukuyori\CM_Analysis\Data\Label\verb_label(ja).txt') # 動詞のラベル群（日本語）
    verb_trans_table_path = os.path.normpath(r'C:\Users\fukuyori\CM_Analysis\Data\Label\verb_screening.csv') # スクリーニング用の対応表
    
    # 作品情報の読み込み
    works_info = read_csv(works_info_path)
    
    # ラベル一覧の読み込み
    # 名詞のラベル一覧（英語、日本語）
    noun_label_en = read_txt(noun_en_path)
    noun_label_ja = read_txt(noun_ja_path)
     # スクリーニング用データ
    noun_trans_table = {data[0]:data[1] for data in read_csv(noun_trans_table_path)}
    noun_label_ja_t = [noun_trans_table[noun_label] if noun_label in noun_trans_table else noun_label for noun_label in noun_label_ja]  
    noun_label_ja = noun_label_ja_t

    # 動詞のラベル一覧（英語、日本語）
    verb_label_en = read_txt(verb_en_path)
    verb_label_ja = read_txt(verb_ja_path)
    # スクリーニング用データ
    verb_trans_table = {data[0]:data[1] for data in read_csv(verb_trans_table_path)}
    verb_label_ja_t = [verb_trans_table[verb_label] if verb_label in verb_trans_table else verb_label for verb_label in verb_label_ja]  
    verb_label_ja = verb_label_ja_t
    
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
    
    # 動画IDリストの作成
    files = os.listdir(video_path)  # 動画ファイル名（動画ID）一覧を取得
    video_id_list = [f.replace('.mp4', '') for f in files]  # 一覧から拡張子を削除
    
    # ラベルIDのイテレータを作成[名詞ラベル用]    
    start_ID = 10000 # ID開始値
    noun_label_id_list = ['N' + str(start_ID + x) for x in range(1, start_ID, 1)]
    noun_label_id = iter(noun_label_id_list)

    # ラベルIDのイテレータを作成[名詞ラベル用]    
    start_ID = 10000 # ID開始値
    verb_label_id_list = ['V' + str(start_ID + x) for x in range(1, start_ID, 1)]
    verb_label_id = iter(verb_label_id_list)

    # シーン好感度IDのイテレータを作成
    start_ID = 20000 # ID開始値
    favo_id_list = [start_ID + x for x in range(1, start_ID, 1)]
    favo_id = iter(favo_id_list)

    # シーンラベルIDのイテレータを作成
    start_ID = 20000 # ID開始値
    label_id_list = [start_ID + x for x in range(1, start_ID, 1)]
    labels_id = iter(label_id_list)

    # 行と列を転置
    ranking_data = np.array(ranking_data).T.tolist()

    # 格納するデータ
    works_data = []     # 作品データ        [video_id, company_name, brand_name, product_name]
    label_list = []     # ラベル一覧        [label_id, label_name_ja, label_name_en]
    scene_data = []     # シーンデータ      [video_id, scene_no, scene_favo_id, scene_label_id, label_count]
    scene_favo = []     # シーン好感度      [scene_favo_id, category, favo]
    scene_label = []    # シーンラベル      [scene_label_id, label_no, label_id, recognition_score, x_axis, y_axis, width, height]
    access_history = [] # アクセスデータ    [video_id, last_access_time]
    rank_data = []      # ランキングデータ  [category, kubun, ranking, label, count, norm]
    
    # 作品データに格納
    for info in works_info:
        video_id = info[1]
        meta_data = info[2].split('／')
        company_name = meta_data[0]
        brand_name = meta_data[1]
        product_name = meta_data[2]
        works_data.append([video_id, company_name, brand_name, product_name])

    # ラベル一覧に格納
    for i in range(len(noun_label_en)):
        label_list.append([next(noun_label_id), noun_label_ja[i], noun_label_en[i]])

    for i in range(len(verb_label_en)):
        label_list.append([next(verb_label_id), verb_label_ja[i], verb_label_en[i]])

    # 分析結果からシーンデータとシーンラベル、シーン好感度を格納
    for result_data in result_data_ALL:
        video_id = result_data[0]       # 動画ID
        scene_no = result_data[1]       # シーン番号
        scene_favo_id = next(favo_id)   # シーン好感度ID
        scene_label_id = next(labels_id) # シーンラベルID
        favo_data = result_data[5:]     # 好感度データ
        labels_data = ast.literal_eval(result_data[4].replace('][', ', '))   # ラベルデータ
        labels_count = len(labels_data) # ラベルカウント

        # シーンデータに格納
        scene_data.append([video_id, scene_no, scene_favo_id, scene_label_id, labels_count])

        # シーン好感度に格納
        for i in range(len(score_category)):
            category = score_category[i][0] # カテゴリ
            favo = favo_data[i]             # 該当カテゴリの好感度
            scene_favo.append([scene_favo_id, category, favo])
        
        # シーンラベルに格納
        for i in range(labels_count):
            # 物体ラベルの時（ラベルデータがリスト型の時）
            if isinstance(labels_data[i], list):
                label_name = labels_data[i][0]          # ラベル名
                label_id = [l[0] for l in label_list if l[1] == label_name][0]  # ラベルID

                recognition_score = labels_data[i][1]   # 認識スコア
                x_axis = labels_data[i][2]              # x軸
                y_axis = labels_data[i][3]              # y軸
                width = labels_data[i][4]               # 幅
                height = labels_data[i][5]              # 高さ
                
                scene_label.append([scene_label_id, i+1, label_id, recognition_score, x_axis, y_axis, width, height])

            # 動作ラベルの時（ラベルデータが文字列の時）
            else:
                label_name = labels_data[i] # ラベル名
                label_id = [l[0] for l in label_list if l[1] == label_name][0]  # ラベルID

                scene_label.append([scene_label_id, i+1, label_id, None, None, None, None, None])

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

    # --------------------------------------------------
    # DBに格納
    # --------------------------------------------------
    target_db = 'analysis_db'   # 格納するデータベース

    # データベースに接続
    db, cursor = connection_to_db(target_db)
    
    # データ格納前の初期化
    delete_table(db, cursor, "works_data")
    delete_table(db, cursor, "label_list")
    delete_table(db, cursor, "scene_data")
    delete_table(db, cursor, "scene_favo")
    delete_table(db, cursor, "scene_label")
    delete_table(db, cursor, "ranking")
    delete_table(db, cursor, "access_history")

    
    # 作品データテーブル[works_data]の作成
    cursor.execute("""CREATE TABLE IF NOT EXISTS works_data(
                    video_id VARCHAR(30),
                    company_name VARCHAR(50),
                    brand_name VARCHAR(50),
                    product_name VARCHAR(50));""")
    db.commit()

    # ラベルテーブル[label_list]の作成
    cursor.execute("""CREATE TABLE IF NOT EXISTS label_list(
                    label_id VARCHAR(30), 
                    label_name_ja VARCHAR(50),  
                    label_name_en VARCHAR(50));""")
    db.commit()

    # シーンデータテーブル[scene_data]の作成
    cursor.execute("""CREATE TABLE IF NOT EXISTS scene_data(
                    video_id VARCHAR(30),
                    scene_no VARCHAR(30),
                    scene_favo_id VARCHAR(30),
                    scene_label_id VARCHAR(30),
                    labels_count INT);""")
    db.commit()

    # シーン好感度テーブル[scene_favo]の作成
    cursor.execute("""CREATE TABLE IF NOT EXISTS scene_favo(
                    scene_favo_id VARCHAR(30),
                    category VARCHAR(10), 
                    favo FLOAT);""")
    db.commit()

    # シーンラベルテーブル[scene_label]の作成
    cursor.execute("""CREATE TABLE IF NOT EXISTS scene_label(
                    scene_label_id VARCHAR(30),
                    labels_no INT,
                    label_id VARCHAR(30), 
                    recognition_score FLOAT,
                    x_axis INT, 
                    y_axis INT, 
                    width INT, 
                    height INT);""")
    db.commit()

    # ランキングテーブル[ranking]の作成
    cursor.execute("""CREATE TABLE IF NOT EXISTS ranking(
                    category VARCHAR(10),
                    kubun VARCHAR(30),
                    ranking INT,
                    label VARCHAR(30),
                    count INT,
                    norm FLOAT);""")
    db.commit()

    # アクセスデータテーブル[access_history]の作成    
    cursor.execute("""CREATE TABLE IF NOT EXISTS access_history(
                    video_id VARCHAR(30),
                    last_access_time TIMESTAMP);""")
    db.commit()
    
    # 作品データを挿入
    insert_data = "INSERT INTO works_data (video_id, company_name, brand_name, product_name) VALUES (%s, %s, %s, %s);"
    
    for wd in works_data:
        cursor.execute(insert_data, wd)
    db.commit()

    # ラベル一覧を挿入
    insert_data = "INSERT INTO label_list (label_id, label_name_ja, label_name_en) VALUES (%s, %s, %s);"

    for ld in label_list:
        cursor.execute(insert_data, ld)
    db.commit()

    # シーンデータを挿入
    insert_data = "INSERT INTO scene_data (video_id, scene_no, scene_favo_id, scene_label_id, labels_count) VALUES (%s, %s, %s, %s, %s);"
    
    for sd in scene_data:
        cursor.execute(insert_data, sd)
    db.commit()

    # シーン好感度を挿入
    insert_data = "INSERT INTO scene_favo (scene_favo_id, category, favo) VALUES (%s, %s, %s);"
    
    for sf in scene_favo:
        cursor.execute(insert_data, sf)
    db.commit()

    # シーンラベルを挿入
    insert_data = "INSERT INTO scene_label (scene_label_id, labels_no, label_id, recognition_score, x_axis, y_axis, width, height) VALUES (%s, %s, %s, %s, %s, %s, %s, %s);"
    
    for sl in scene_label:
        cursor.execute(insert_data, sl)
    db.commit()

    # ランキングデータを挿入
    insert_data = "INSERT INTO ranking (category, kubun, ranking, label, count, norm) VALUES (%s, %s, %s, %s, %s, %s);"
    
    for rd in rank_data:
        cursor.execute(insert_data, rd)
    db.commit()

    # アクセスデータを挿入
    insert_data = "INSERT INTO access_history (video_id, last_access_time) VALUES (%s, %s);"
    
    for ah in access_history:
        cursor.execute(insert_data, ah)
    db.commit()