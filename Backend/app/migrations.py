from sqlalchemy import inspect, text
from .database import engine

# Простий механізм "додай колонку, якщо її ще нема" — не повноцінні міграції (Alembic),
# але безпечний для повторного виконання при кожному старті сервера.
# Коли в майбутньому додаємо нове поле до ВЖЕ існуючої таблиці — дописуємо рядок сюди.
COLUMNS_TO_ENSURE = [
    # (таблиця, колонка, SQL-тип)
    ("events", "era_id", "INTEGER"),
    ("events", "arc_id", "INTEGER"),
    ("events", "branch_id", "INTEGER"),
    ("locations", "dimension_id", "INTEGER"),
    ("projects", "cover_url", "VARCHAR"),
    ("characters", "image_url", "VARCHAR"),  # НОВЕ
    ("factions", "image_url", "VARCHAR"),    # НОВЕ
]


def run_lightweight_migrations():
    inspector = inspect(engine)
    with engine.connect() as conn:
        for table, column, col_type in COLUMNS_TO_ENSURE:
            if table not in inspector.get_table_names():
                continue  # таблиці ще немає — create_all() сам створить її з усіма колонками
            existing_columns = [c["name"] for c in inspector.get_columns(table)]
            if column not in existing_columns:
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}"))
                conn.commit()
                print(f"[migrations] Додано колонку {table}.{column}")