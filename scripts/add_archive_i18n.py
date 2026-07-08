import json

es_additions = {
    "archivedBanner": "Proyecto archivado",
    "archivedBannerDesc": "Este proyecto está en modo lectura. Desarchívalo para editarlo.",
    "archivedAction": "Desarchivar",
    "archivedBlockedMsg": "Este proyecto está archivado y no se puede modificar."
}

en_additions = {
    "archivedBanner": "Archived project",
    "archivedBannerDesc": "This project is in read-only mode. Unarchive it to make changes.",
    "archivedAction": "Unarchive",
    "archivedBlockedMsg": "This project is archived and cannot be modified."
}

for lang, additions in [('es', es_additions), ('en', en_additions)]:
    with open(f'locales/{lang}.json', encoding='utf-8') as f:
        d = json.load(f)
    if 'project' not in d:
        d['project'] = {}
    d['project'].update(additions)
    with open(f'locales/{lang}.json', 'w', encoding='utf-8') as f:
        json.dump(d, f, ensure_ascii=False, indent=2)
    print(f'Updated {lang}.json')
