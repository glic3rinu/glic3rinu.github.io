# USAGE 1: User -> Twitt -> Word
# python3 generate-graph.py | neo4j-community-2.0.1/bin/neo4j-shell

# USAGE 2: User -> Twitt -> Trademark
# python3 generate-graph.py -t | neo4j-community-2.0.1/bin/neo4j-shell


import json
import glob
import re
import sys


TRADEMARKS_FILE = 'results/trademarks.txt'
TRADEMARKS_NO_EXHIBITORS_FILE = 'results/trademarks_no_shelf.txt'
DATASET_GLOB = 'dataset/*out'
IGNORE = '[:,?!.\'";#\(\)\[\]@]' # Ignore punctuation


def create_trademarks():
    trademarks = []
    trademark_names = []
    
    with open(TRADEMARKS_FILE, 'r') as trademarks_file:
        for line in trademarks_file.readlines():
            name = line.strip()
            verbose = line.strip()
            exhibitor = True
            trademarks.append((name, verbose, exhibitor))
    
    with open(TRADEMARKS_NO_EXHIBITORS_FILE, 'r') as trademarks_file:
        for line in trademarks_file.readlines():
            name = line.strip()
            verbose = line.strip()
            exhibitor = False
            trademarks.append((name, verbose, exhibitor))
    
    for name, verbose, exhibitor in trademarks:
        trademark_names.append(name)
        context = {
            'name': name,
            'verbose_name': verbose.replace("'", '"'),
            'is_exhibitor': exhibitor,
        }
        print(
            "MERGE (n: Trademark { name: '%(name)s' }) "
            "ON CREATE SET"
            "   n.verbose_name = '%(verbose_name)s', "
            "   n.is_exhibitor = %(is_exhibitor)s"
            ";"
            % context)
    return trademark_names


def process_twitts(trademarks=None):
    for out in glob.glob(DATASET_GLOB):
        twitts = open(out, 'r').read().replace('}{', '},{')
        twitts = '[%s]' % twitts
        twitts = json.loads(twitts)
        for twitt in twitts:
            # Create Users
            user = twitt['user']
            context = {
                'user_id': user['id'],
                'name': user['name'].replace("'", '"'),
                'location': user['location'].replace("'", '"'),
                'lang': user['lang'],
                'time_zone': "'%s'" % user['time_zone'].replace("'", '"') if user['time_zone'] else 'NULL',
            }
            print(
                "MERGE (n: User { id: '%(user_id)s' }) "
                "ON CREATE SET"
                "   n.name = '%(name)s', "
                "   n.location = '%(location)s', "
                "   n.lang = '%(lang)s', "
                "   n.time_zone = %(time_zone)s "
                ";"
                % context)
            
            context.update({
                'twitt_id': twitt['id'],
                'text': twitt['text'].replace("'", '"'),
                'created_at': twitt['created_at'],
                'geo': twitt['geo']['coordinates'] if twitt['geo'] else 'NULL',
#                'place': twitt['place']['bounding_box']['coordinates'] if twitt['place'] else 'NULL',
            })
            print(
                "MERGE (n: Twitt { id: '%(twitt_id)s' }) "
                "ON CREATE SET"
                "    n.text = '%(text)s', "
                "    n.created_at = '%(created_at)s', "
                "    n.geo = %(geo)s, "
#                "    n.place = %(place)s "
                ";"
                % context)
            # Create relation Twitt -> User
            print(
                "MATCH (a: Twitt), (b: User) "
                "WHERE a.id = '%(twitt_id)s' AND b.id = '%(user_id)s' "
                "CREATE (a)-[r:twitted_by]->(b);"
                % context)
            if trademarks is None:
                # Generate words
                for word in twitt['text'].split():
                    word = word.lower()
                    context['word'] = re.sub(IGNORE, ' ', word)
                    print("MERGE (n: Word { value: '%(word)s' });" % context)
                    print(
                        "MATCH (a: Twitt), (b: Word) "
                        "WHERE a.id = '%(twitt_id)s' AND b.value = '%(word)s' "
                        "CREATE (a)-[r:appears]->(b);"
                        % context)
            else:
                # Create relation Twitt -> Trademark
                for trademark in trademarks:
                    found = False
                    for word in twitt['text'].split():
                        word = word.lower()
                        word = re.sub(IGNORE, '', word)
                        if word == trademark:
                            found = True
                            break
                    if found:
                        context['trademark_name'] = trademark
                        print(
                            "MATCH (a: Twitt), (b: Trademark) "
                            "WHERE a.id = '%(twitt_id)s' AND b.name = '%(trademark_name)s' "
                            "CREATE UNIQUE (a)-[r:commented]->(b);"
                            % context)


if len(sys.argv) is 2 and sys.argv[1] == '-t':
    trademarks = create_trademarks()
    process_twitts(trademarks=trademarks)
else:
    process_twitts()
