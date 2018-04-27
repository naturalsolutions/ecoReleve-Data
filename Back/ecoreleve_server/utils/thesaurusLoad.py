from sqlalchemy import select

from ..core import Base


thesaurusDictTraduction = {}
invertedThesaurusDict = {'en': {}, 'fr': {}}
userOAuthDict = {}


def loadThesaurusTrad(config):
    session = config.registry.dbmaker()
    thesTable = Base.metadata.tables['ERDThesaurusTerm']
    query = select(thesTable.c)

    results = session.execute(query).fetchall()

    for row in results:
        newTraduction = {
            'en': row['nameEn'], 'fr': row['nameFr'], 'parentID': row['parentID']}
        if thesaurusDictTraduction.get(row['fullPath'], None):
            thesaurusDictTraduction[row['fullPath']].append(newTraduction)
      
        else:
            thesaurusDictTraduction[row['fullPath']] = [newTraduction]
        invertedThesaurusDict['en'][row['nameEn']] = row['fullPath']
        invertedThesaurusDict['fr'][row['nameFr']] = row['fullPath']
    session.close()