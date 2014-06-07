import glob
import json
import os
import re
import sys
import subprocess


PUNCTUATION = '[:,?!.\'";#\(\)\[\]]' # Ignore punctuation


def count_dataset_words():
    dataset_path = os.environ.get('DATASET_PATH', os.curdir)
    dataset_path = os.path.join(dataset_path, '*.out')
    words = {}
    for out in glob.glob(dataset_path):
        twitts = open(out, 'r').read().replace('}{', '},{')
        twitts = '[%s]' % twitts
        twitts = json.loads(twitts)
        for twitt in twitts:
            for word in twitt['text'].split():
                word = word.encode('utf-8')
                word = word.lower()
                word = re.sub(PUNCTUATION, '', word)
                words[word] = words.get(word, 0) + 1
    return words


def order_by_count(words):
    words = list(words.iteritems())
    return sorted(words, key=lambda w: w[1])


def filter_by_trademark(words):
    mapper = {}
    try:
        trademarks = open('/tmp/cached_trademarks.json', 'r')
    except IOError:
        # Fake a legit request to http://www.mobileworldcongress.com/2014-exhibitors
        subprocess.check_output("""
            curl 'http://visitors.genie-connect.com/secure/rest/exhibitors/?_full=true&sort(+name)&_offset=0&_limit=1000000000' \
                -H 'Cookie: GENIECONNECT_ACTIVITY_TOKEN_6292306135089152=92392328-2f43-4b15-815a-774e09dc128b###2014-04-10T17:16:16Z; X_GC_AUTH_VP_6292306135089152=b6342007-6d70-44f4-aad6-5980ac880e07' \
                -H 'EGNamespace: 6292306135089152' \
                -H 'Accept-Encoding: gzip,deflate,sdch' \
                -H 'X-GM-Platform: portal' \
                -H 'Accept-Language: en-US,en;q=0.8,es;q=0.6,en-GB;q=0.4,ca;q=0.2' \
                -H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/33.0.1750.152 Chrome/33.0.1750.152 Safari/537.36' \
                -H 'Content-Type: application/json; charset=utf-8' \
                -H 'Accept: application/json,application/javascript' \
                -H 'Referer: http://visitors.genie-connect.com/mobileworldcongress2014/preview/index.jsp?mode=exhibitors&jumptoportal=true' \
                -H 'X-Requested-With: XMLHttpRequest' \
                -H 'Connection: keep-alive' --compressed > /tmp/cached_trademarks.json""", shell=True)
        trademarks = open('/tmp/cached_trademarks.json', 'r')
    for trademark in json.loads(trademarks.read()):
        for mark in trademark['name'].split():
            mark = mark.lower()
            mark = re.sub(PUNCTUATION, '', mark)
            if not mark:
                continue
            try:
                mapper[mark] = words[mark]
            except KeyError:
                mapper[mark] = 0
    trademarks.close()
    return mapper



# MAIN
words = count_dataset_words()
#words = filter_by_trademark(words)
words = order_by_count(words)
for word, count in words:
    try:
        print word.encode('utf-8'), count
    except UnicodeDecodeError:
        pass
