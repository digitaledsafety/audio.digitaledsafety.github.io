---
layout: home
title: Home
---

<div class="container mx-auto px-4 py-8">
    <h2 class="text-2xl font-bold mb-4">Available Workspaces</h2>
    <ul class="list-disc pl-5">
        {% for workspace in site.workspaces %}
            <li class="mb-2">
                <a href="{{ site.baseurl }}{{ workspace.url }}" class="text-blue-600 hover:underline">{{ workspace.title }}</a>
            </li>
        {% endfor %}
    </ul>
</div>
