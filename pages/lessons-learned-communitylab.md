---
title: Lessons Learned from Community Lab
layout: standalone-page
date: 2014/05/06
---

<p class="message" style="text-align:center">
    These are some <em>interesting</em> thoughts compiled after my first experiment on 
    <a href="http://community-lab.net/">Community Lab</a> testbed, a project of which I am a former developer.
</p>


1. **Change your mindset, think big**
    
    Don't treat slivers as individual machines, but as a single distributed system (slice).
    
    Automate *everything*, you don't want to manually login into any sliver.
    
    Create large slices to compensate for offline nodes and other failures.
    
    Read [The Seven Deadly Sins of Distributed Systems](https://www.usenix.org/events/worlds04/tech/full_papers/muir/muir.pdf)


2. **Make your experiments idempotent**

    Nodes come and go, you can not assume all your slivers being on the same homogeneous state.
    
    Write experiments in such a way that can run on both, fresh and already deployed nodes.


3. **Use concurrency for experiment deployment and for collecting results**

    You *really* don't want to wait for all of your offline slivers to sequentially timming out their SSH connections.
    
    Use scripting languages like Bash. Bash integrates process management into the language itself:
    
    ```bash
    cat sliver-mgmt-ip.list | while read IP; do
        # This block will run concurrently, because of the ending &
        {
          # Kill possible running experiments
          ssh -o stricthostkeychecking=no \
              root@$IP 'pkill -f experiment.sh'
          # Install and start on background
          scp experiment.sh root@[$IP]: &&
          ssh root@$IP 'nohup bash experiment.sh'
        } &
    done
    ```
    
    There are [specific tools](http://wiki.confine-project.eu/usage:slice-admin#using_your_slice_all_slivers_for_a_common_task) that you can use for parallel execution of one-time commands.


4. **CONFINE REST API doesn't love you too much**

    It's a *node-oriented API*, not *researcher-oriented*. Some *essential information* for your experiments may be cumbersome to obtain.
    
    This snippet exemplifies how to get all the management IPs of your slivers in order to be able to start with your experiment.
    
    ```python
    SLICE_ID = 249
    
    # API calls
    # Requires "pip install confine-orm"
    from orm.api import Api
    controller = Api('https://controller.community-lab.net/api/')
    slivers = controller.slivers.retrieve()
    slivers.retrieve_related('node', 'slice')
    
    # Now calculate sliver MGMT IP according to CONFINE addressing specs
    # https://wiki.confine-project.eu/arch:addressing
    MGMT_IPV6_PREFIX = controller.testbed_params.mgmt_ipv6_prefix
    int_to_hex_str = lambda i,l: ('%.' + str(l) + 'x') % i
    split_by_len = lambda s,l: [s[i:i+l] for i in range(0, len(s), l)]
    for sliver in slivers.filter(slice__id=SLICE_ID):
        node_id = sliver.node.id
        slice_id = sliver.slice.id
        for iface in sliver.interfaces:
            if iface.type == 'management':
                nr = '10' + int_to_hex_str(iface.nr, 2)
                node_id = int_to_hex_str(node_id, 4)
                slice_id = int_to_hex_str(slice_id, 12)
                ipv6_words = MGMT_IPV6_PREFIX.split(':')[:3]
                ipv6_words.extend([node_id, nr])
                ipv6_words.extend(split_by_len(slice_id, 4))
                print ':'.join(ipv6_words)
                break
    ```


5. **Pre-compile things on your own i686 virtual machine**

    Common sliver free space is arround ~700MB, which may be not enough for installing required dev libraries and compiling your average C++ application.
    
    Moreover, doing so in an overcrowded Intel Atom machine will take like... I don't know... 10x more than in your high-end desktop?


6. **Be prepared for network issues**

    Not all nodes have Internet connectivity, `apt-get install` will not always work.

    Network splits are common around community networks. You may end-up having multiple isolated experiments rather than a single one.


7. **Common development tools and network utils are missing :(**

    For sure your first `experiment.sh` will start with something like this (and hope for Internet connectivity being available too):
    
    ```bash
    apt-get update && \
    apt-get install -y inetutils-ping git traceroute tcpdump nano \
        strace screen python
    ```
    
    Also you can [create your own sliver templates](https://wiki.confine-project.eu/soft:debian-template), but most probably you'll have to learn a few things that you didn't want to.


8. **Did you forgot to set the slice state to start?**
    
    Me too :)
