---
title: Hands on Hadoop: The Python Way
layout: standalone-page
date: 2014/02/06
---


<p class="message" style="text-align:center">
This is an extension of <a href="http://www.jorditorres.org/teaching/hands-on/hands-on-installing-apache-hadoop/">this hands on
</p>


Hadoop streaming is a utility that comes with the Hadoop distribution, allowing to create and run jobs with an script as a mapper and reducer.

For example:

    ```bash
    hadoop jar hadoop-1.2.1/contrib/streaming/hadoop-*streaming*.jar \
        -file mapper.py -mapper mapper.py \
        -file reducer.py -reducer reducer.py \
        -input /input -output /output
    ```


The above example specifies the mapper and reducer as Python executables.

Hadoop will connect them in a pipeline fashion:
1. The original input data will be feeded to the mapper via standard input
2. The mapper sends the processed data to the reducer via standard output

Following the `mapper.py` script that counts the number of words:

    ```python
    #!/usr/bin/env python

    import sys

    # read the input from stdin
    for line in sys.stdin:
        # split the line into words
        words = line.split()
        for word in words:
            # one word has been found ;)
            print '%s\t%d' % (word, 1)
    ```


This is the content of `reducer.py`, which adds up the mapper results:

    ```python
    #!/usr/bin/env python

    import sys

    counter = {}

    # read the input from stdin
    for line in sys.stdin:
        # parse the line from mapper
        word, count = line.split('\t', 1)
        # increase the word counter
        counter[word] = counter.get(word, 0) + int(count)

    # output the results
    for word, count in counter.iteritems():
        print '%s\t%d' % (word, count)
    ```


Just don't forget to add execution permission to the mapper and reducer scripts

    ```bash
    chmod +x {mapper,reducer}.py
    ```


A nice thing about scripts is that they can be easily tested without having to run Hadoop at all !

    ```bash
    hadoop@hadoop:~$ cat pg19699.txt | ./mapper.py | ./reducer.py
    Nipata_	1
    scales	6
    forbid	1
    Robert	39
    nationalities	2
    Umbrian	1
    Wiltshire.	2
    motor	2
    apply	10
    Conditions	2
    ...
    ```


In conclusion, the streaming utility combined with the Python programming language makes a very friendly environment for beginners.

External libraries and complex compilations get out of the way, so you can start playing with Hadoop right away.


