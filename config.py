import os


class Config:
    DEBUG = False


class DevelopmentConfig(Config):
    DEBUG = True
    DEVELOPMENT = True


config = {
    "development": DevelopmentConfig,
    "default": DevelopmentConfig,
}
