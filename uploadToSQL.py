import pandas as pd
from sqlalchemy import create_engine
import psycopg2

# ============ 配置 ============
excel_path = 'C:/Users/Julia_zzy/Desktop/front/24年数据总表_仅A股_合并稿_v250516.xlsx'
sheet_name = '24年汇总'
table_name = 'dataasset_listed_companies_2024'  # ✅ 上传到 PostgreSQL 的目标表名

db_params = {
    'dbname': 'admin_db',
    'user': 'neondb_owner',
    'password': 'npg_8dJzhgouUKQ5',
    'host': 'ep-raspy-block-a1h66hce-pooler.ap-southeast-1.aws.neon.tech',
    'port': '5432'
}

# ============ 建立连接 ============
engine = create_engine(
    f"postgresql+psycopg2://{db_params['user']}:{db_params['password']}@{db_params['host']}:{db_params['port']}/{db_params['dbname']}"
)
conn = psycopg2.connect(**db_params)
conn.autocommit = True
cursor = conn.cursor()

# ============ 上传逻辑 ============
try:
    print(f"\n📄 正在读取 sheet: {sheet_name}")
    df = pd.read_excel(excel_path, sheet_name=sheet_name)

    # 删除“序号”列（如果存在）
    if '序号' in df.columns:
        df.drop(columns=['序号'], inplace=True)
        print("🚮 已删除 '序号' 列")

    # 删除旧表
    cursor.execute(f'DROP TABLE IF EXISTS "{table_name}";')
    print(f"🗑️ 已删除旧表: {table_name}")

    # 上传新表
    df.to_sql(table_name, con=engine, if_exists='replace', index=False)
    print(f"✅ 成功上传表: {table_name}（共 {len(df)} 行）")

except Exception as e:
    print(f"❌ 上传过程中出错: {e}")

# ============ 关闭连接 ============
cursor.close()
conn.close()
