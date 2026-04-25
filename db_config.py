import os
from contextlib import contextmanager

import mysql.connector
from mysql.connector import Error
from mysql.connector.pooling import MySQLConnectionPool

_connection_pool = None


def _build_db_config() -> dict:
    return {
        "host": os.getenv("DB_HOST", "127.0.0.1"),
        "port": int(os.getenv("DB_PORT", "3306")),
        "user": os.getenv("DB_USER", "root"),
        "password": os.getenv("DB_PASSWORD", ""),
        "database": os.getenv("DB_NAME", "sentinelx"),
        "autocommit": False,
    }


def get_connection_pool() -> MySQLConnectionPool:
    global _connection_pool

    if _connection_pool is None:
        _connection_pool = MySQLConnectionPool(
            pool_name="sentinelx_pool",
            pool_size=int(os.getenv("DB_POOL_SIZE", "8")),
            **_build_db_config(),
        )

    return _connection_pool


def get_db_connection():
    try:
        pool = get_connection_pool()
        return pool.get_connection()
    except Error as exc:
        raise RuntimeError(f"Database connection failed: {exc}") from exc


@contextmanager
def get_db_cursor(dictionary: bool = True):
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=dictionary)
        yield connection, cursor
    except Error as exc:
        if connection:
            connection.rollback()
        raise RuntimeError(f"Database operation failed: {exc}") from exc
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()
