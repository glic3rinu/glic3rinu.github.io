---
layout: page
title: Pages Index
---

<p>
{% for page in site.pages %}
  {% if page.layout == "standalone-page" %}
  * {{ page.date | date_to_string }} &raquo; [ {{ page.title }} ]({{ page.url }})
  {% endif %}
{% endfor %}
