// i18n — Software Catalog UI chrome. English source strings ARE the keys, so a
// missing entry falls back to English. Locale comes from the fleet resolver
// (carino-lang.js: ?lang > cookie > browser > en); this file only owns the
// dictionaries and re-applies them on 'carino:langchange'.
// App names, install commands, package ids and card data stay untranslated.

const I18N = {
    es: {
        'Late shift.': 'Turno nocturno.',
        'Good morning.': 'Buenos días.',
        'Good afternoon.': 'Buenas tardes.',
        'Good evening.': 'Buenas noches.',
        // Slice menu / panel titles
        'Highlights': 'Destacados',
        'Basic Software': 'Software básico',
        'General Software': 'Software general',
        'Professional': 'Profesional',
        'IT & Systems': 'TI y sistemas',
        'Security': 'Seguridad',
        // Subcategory dividers
        'Curated Highlights': 'Selección destacada',
        'Essentials': 'Esenciales',
        'Web Browsers': 'Navegadores web',
        'Language and Culture': 'Idiomas y cultura',
        'Gaming and Entertainment': 'Juegos y entretenimiento',
        'Multimedia and Design': 'Multimedia y diseño',
        'AI / Machine learning': 'IA / Aprendizaje automático',
        'Development': 'Desarrollo',
        'Open Source related': 'Código abierto',
        'STEM and Research': 'STEM e investigación',
        'IT and DevOps': 'TI y DevOps',
        'Operating Systems': 'Sistemas operativos',
        'Hardware': 'Hardware',
        'Monitoring and Status': 'Monitoreo y estado',
        '(Cyber)Security': '(Ciber)seguridad',
        // Platform filter button
        'Showing Windows only — click for all': 'Mostrando solo Windows: clic para ver todo',
        'Showing macOS only — click for all': 'Mostrando solo macOS: clic para ver todo',
        'Showing Linux only — click for all': 'Mostrando solo Linux: clic para ver todo',
        'Showing all platforms': 'Mostrando todas las plataformas',
        'All platforms — click to filter by OS': 'Todas las plataformas: clic para filtrar por SO',
        // Card install tooltips
        'Open website': 'Abrir sitio web',
        'Copy Windows install command': 'Copiar comando de instalación de Windows',
        'Copy macOS install command': 'Copiar comando de instalación de macOS',
        'Copy Debian/Ubuntu command': 'Copiar comando de Debian/Ubuntu',
        'Copy Fedora command': 'Copiar comando de Fedora',
        'Copy openSUSE command': 'Copiar comando de openSUSE',
        'Copy RHEL command': 'Copiar comando de RHEL',
        'Copy Flatpak command': 'Copiar comando de Flatpak',
        // Notifications
        'Install command copied! Paste it in your terminal.': '¡Comando de instalación copiado! Pégalo en tu terminal.',
        'Could not copy to clipboard.': 'No se pudo copiar al portapapeles.',
        // Search / My List
        'Search Results': 'Resultados de búsqueda',
        'No Results': 'Sin resultados',
        'My List': 'Mi lista',
        'Nothing here yet.': 'Aún no hay nada aquí.',
        'Your list is empty. Click any software card to bookmark it.': 'Tu lista está vacía. Haz clic en cualquier tarjeta de software para guardarla.',
        // Header attributes
        'Search software...': 'Buscar software...',
        'Platform filter': 'Filtro de plataforma',
    },
    'pt-BR': {
        'Late shift.': 'Turno da noite.',
        'Good morning.': 'Bom dia.',
        'Good afternoon.': 'Boa tarde.',
        'Good evening.': 'Boa noite.',
        'Highlights': 'Destaques',
        'Basic Software': 'Software básico',
        'General Software': 'Software geral',
        'Professional': 'Profissional',
        'IT & Systems': 'TI e sistemas',
        'Security': 'Segurança',
        'Curated Highlights': 'Seleção em destaque',
        'Essentials': 'Essenciais',
        'Web Browsers': 'Navegadores web',
        'Language and Culture': 'Idiomas e cultura',
        'Gaming and Entertainment': 'Jogos e entretenimento',
        'Multimedia and Design': 'Multimídia e design',
        'AI / Machine learning': 'IA / Aprendizado de máquina',
        'Development': 'Desenvolvimento',
        'Open Source related': 'Código aberto',
        'STEM and Research': 'STEM e pesquisa',
        'IT and DevOps': 'TI e DevOps',
        'Operating Systems': 'Sistemas operacionais',
        'Hardware': 'Hardware',
        'Monitoring and Status': 'Monitoramento e status',
        '(Cyber)Security': '(Ciber)segurança',
        'Showing Windows only — click for all': 'Mostrando só Windows: clique para ver tudo',
        'Showing macOS only — click for all': 'Mostrando só macOS: clique para ver tudo',
        'Showing Linux only — click for all': 'Mostrando só Linux: clique para ver tudo',
        'Showing all platforms': 'Mostrando todas as plataformas',
        'All platforms — click to filter by OS': 'Todas as plataformas: clique para filtrar por SO',
        'Open website': 'Abrir site',
        'Copy Windows install command': 'Copiar comando de instalação do Windows',
        'Copy macOS install command': 'Copiar comando de instalação do macOS',
        'Copy Debian/Ubuntu command': 'Copiar comando do Debian/Ubuntu',
        'Copy Fedora command': 'Copiar comando do Fedora',
        'Copy openSUSE command': 'Copiar comando do openSUSE',
        'Copy RHEL command': 'Copiar comando do RHEL',
        'Copy Flatpak command': 'Copiar comando do Flatpak',
        'Install command copied! Paste it in your terminal.': 'Comando de instalação copiado! Cole no seu terminal.',
        'Could not copy to clipboard.': 'Não foi possível copiar para a área de transferência.',
        'Search Results': 'Resultados da busca',
        'No Results': 'Nenhum resultado',
        'My List': 'Minha lista',
        'Nothing here yet.': 'Nada por aqui ainda.',
        'Your list is empty. Click any software card to bookmark it.': 'Sua lista está vazia. Clique em qualquer card de software para salvá-lo.',
        'Search software...': 'Buscar software...',
        'Platform filter': 'Filtro de plataforma',
    },
    ja: {
        'Late shift.': '夜勤お疲れさま。',
        'Good morning.': 'おはようございます。',
        'Good afternoon.': 'こんにちは。',
        'Good evening.': 'こんばんは。',
        'Highlights': 'ハイライト',
        'Basic Software': '基本ソフト',
        'General Software': '一般ソフト',
        'Professional': 'プロフェッショナル',
        'IT & Systems': 'IT・システム',
        'Security': 'セキュリティ',
        'Curated Highlights': '厳選ハイライト',
        'Essentials': '定番ソフト',
        'Web Browsers': 'Webブラウザ',
        'Language and Culture': '言語と文化',
        'Gaming and Entertainment': 'ゲーム・エンタメ',
        'Multimedia and Design': 'マルチメディア・デザイン',
        'AI / Machine learning': 'AI・機械学習',
        'Development': '開発',
        'Open Source related': 'オープンソース関連',
        'STEM and Research': 'STEM・研究',
        'IT and DevOps': 'IT・DevOps',
        'Operating Systems': 'OS',
        'Hardware': 'ハードウェア',
        'Monitoring and Status': '監視・ステータス',
        '(Cyber)Security': '(サイバー)セキュリティ',
        'Showing Windows only — click for all': 'Windowsのみ表示中 — クリックで全表示',
        'Showing macOS only — click for all': 'macOSのみ表示中 — クリックで全表示',
        'Showing Linux only — click for all': 'Linuxのみ表示中 — クリックで全表示',
        'Showing all platforms': '全プラットフォームを表示中',
        'All platforms — click to filter by OS': '全プラットフォーム — クリックでOS別に絞り込み',
        'Open website': 'サイトを開く',
        'Copy Windows install command': 'Windowsのインストールコマンドをコピー',
        'Copy macOS install command': 'macOSのインストールコマンドをコピー',
        'Copy Debian/Ubuntu command': 'Debian/Ubuntuのコマンドをコピー',
        'Copy Fedora command': 'Fedoraのコマンドをコピー',
        'Copy openSUSE command': 'openSUSEのコマンドをコピー',
        'Copy RHEL command': 'RHELのコマンドをコピー',
        'Copy Flatpak command': 'Flatpakのコマンドをコピー',
        'Install command copied! Paste it in your terminal.': 'インストールコマンドをコピーしました。ターミナルに貼り付けてください。',
        'Could not copy to clipboard.': 'クリップボードにコピーできませんでした。',
        'Search Results': '検索結果',
        'No Results': '該当なし',
        'My List': 'マイリスト',
        'Nothing here yet.': 'まだ何もありません。',
        'Your list is empty. Click any software card to bookmark it.': 'リストは空です。ソフトのカードをクリックするとブックマークできます。',
        'Search software...': 'ソフトを検索...',
        'Platform filter': 'プラットフォームフィルター',
    },
    ru: {
        'Late shift.': 'Ночная смена.',
        'Good morning.': 'Доброе утро.',
        'Good afternoon.': 'Добрый день.',
        'Good evening.': 'Добрый вечер.',
        'Highlights': 'Избранное',
        'Basic Software': 'Базовое ПО',
        'General Software': 'Общее ПО',
        'Professional': 'Профессиональное',
        'IT & Systems': 'ИТ и системы',
        'Security': 'Безопасность',
        'Curated Highlights': 'Подборка избранного',
        'Essentials': 'Самое необходимое',
        'Web Browsers': 'Веб-браузеры',
        'Language and Culture': 'Языки и культура',
        'Gaming and Entertainment': 'Игры и развлечения',
        'Multimedia and Design': 'Мультимедиа и дизайн',
        'AI / Machine learning': 'ИИ / Машинное обучение',
        'Development': 'Разработка',
        'Open Source related': 'Открытый исходный код',
        'STEM and Research': 'STEM и исследования',
        'IT and DevOps': 'ИТ и DevOps',
        'Operating Systems': 'Операционные системы',
        'Hardware': 'Оборудование',
        'Monitoring and Status': 'Мониторинг и статус',
        '(Cyber)Security': '(Кибер)безопасность',
        'Showing Windows only — click for all': 'Только для Windows — нажмите, чтобы показать всё',
        'Showing macOS only — click for all': 'Только для macOS — нажмите, чтобы показать всё',
        'Showing Linux only — click for all': 'Только для Linux — нажмите, чтобы показать всё',
        'Showing all platforms': 'Показаны все платформы',
        'All platforms — click to filter by OS': 'Все платформы — нажмите, чтобы фильтровать по ОС',
        'Open website': 'Открыть сайт',
        'Copy Windows install command': 'Скопировать команду установки для Windows',
        'Copy macOS install command': 'Скопировать команду установки для macOS',
        'Copy Debian/Ubuntu command': 'Скопировать команду для Debian/Ubuntu',
        'Copy Fedora command': 'Скопировать команду для Fedora',
        'Copy openSUSE command': 'Скопировать команду для openSUSE',
        'Copy RHEL command': 'Скопировать команду для RHEL',
        'Copy Flatpak command': 'Скопировать команду для Flatpak',
        'Install command copied! Paste it in your terminal.': 'Команда установки скопирована! Вставьте её в терминал.',
        'Could not copy to clipboard.': 'Не удалось скопировать в буфер обмена.',
        'Search Results': 'Результаты поиска',
        'No Results': 'Ничего не найдено',
        'My List': 'Мой список',
        'Nothing here yet.': 'Здесь пока пусто.',
        'Your list is empty. Click any software card to bookmark it.': 'Ваш список пуст. Нажмите на карточку программы, чтобы добавить её в закладки.',
        'Search software...': 'Поиск программ...',
        'Platform filter': 'Фильтр платформ',
    },
};

function currentFleetLang() { return (window.CarinoLang && window.CarinoLang.current) || 'en'; }

function t(key) {
    const dict = I18N[currentFleetLang()];
    return (dict && dict[key]) || key;
}

// main.js (loaded before this file) calls window.scT at render time when
// available, so JS-built cards/panels come out already translated.
window.scT = t;

// Static markup + JS-generated elements carrying data-i18n: the original
// English text is the key (captured on first pass; generated elements pre-set
// data-i18n-key themselves), so locale switches stay reversible.
function applyStaticI18n() {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
        if (!el.dataset.i18nKey) el.dataset.i18nKey = el.textContent.trim();
        el.textContent = t(el.dataset.i18nKey);
    });
}

// Prominent attributes, addressed explicitly (not via data-i18n).
function applyAttrI18n() {
    const search = document.getElementById('search-input');
    if (search) search.placeholder = t('Search software...');
    const myList = document.getElementById('my-list-btn');
    if (myList) {
        myList.title = t('My List');
        myList.setAttribute('aria-label', t('My List'));
    }
    const platform = document.getElementById('platform-btn');
    if (platform) platform.setAttribute('aria-label', t('Platform filter'));
}

function applyI18n() {
    document.documentElement.lang = currentFleetLang();
    applyStaticI18n();
    applyAttrI18n();
}

document.addEventListener('DOMContentLoaded', applyI18n);
window.addEventListener('carino:langchange', applyI18n);
