from os.path import dirname
import os


def import_submodule():
    modules_folder = os.listdir(dirname(__file__))
    modules = [ f for f in modules_folder if '.' not in f]

    __import__('ecoreleve_server.modules',globals(), locals(),modules)
