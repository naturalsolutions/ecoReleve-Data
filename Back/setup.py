import os

from setuptools import setup, find_packages

here = os.path.abspath(os.path.dirname(__file__))
with open(os.path.join(here, 'README.txt')) as f:
    README = f.read()
with open(os.path.join(here, 'CHANGES.txt')) as f:
    CHANGES = f.read()

requires = [
    'pyramid',
    'pypyodbc',
    'pyramid_chameleon',
    'pyramid_debugtoolbar',
    'pyramid_tm',
    'sqlalchemy==1.0.8',
    'sqlalchemy-utils==0.30.11',
    'transaction',
    'zope.sqlalchemy',
    'waitress',
    'webtest',
    'XlsxWriter==0.8.4',
    'openpyxl===2.2.2',
    'psutil',
    'pyramid_jwtauth',
    'pyexcel==0.2.5',
    'pyexcel-io==0.2.2',
    'pyexcel-webio==0.0.7',
    'pyexcel-xls==0.2.2',
    'pyexcel-xlsx==0.2.1',
    'pyramid-excel==0.0.3'
    ]

setup(name='ecoreleve_server',
      version='1.0',
      description='ecoReleve_Server',
      long_description=README + '\n\n' + CHANGES,
      classifiers=[
        "Programming Language :: Python",
        "Framework :: Pyramid",
        "Topic :: Internet :: WWW/HTTP",
        "Topic :: Internet :: WWW/HTTP :: WSGI :: Application",
        ],
      author='',
      author_email='',
      url='',
      keywords='web wsgi bfg pylons pyramid',
      packages=find_packages(),
      include_package_data=True,
      zip_safe=False,
      test_suite='ecoreleve_server',
      install_requires=requires,
      entry_points="""\
      [paste.app_factory]
      main = ecoreleve_server:main
      [console_scripts]
      initialize_ecoReleve_Server_db = ecoreleve_server.scripts.initializedb:main
      """,
      )
