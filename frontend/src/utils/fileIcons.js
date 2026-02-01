const iconMap = {
    // Special Filenames
    ".gitignore": "file_type_git",
    "dockerfile": "file_type_docker",
    ".npmignore": "file_type_npm",
    ".prettierrc": "file_type_prettier",
    ".eslintrc": "file_type_eslint",
    ".babelrc": "file_type_babel2",
    "babel.config.js": "file_type_babel2",
    "style.css": "file_type_css2",
    // Extensions
    js: "file_type_js",
    jsx: "file_type_reactjs",
    ts: "file_type_typescript",
    tsx: "file_type_reactts",
    py: "file_type_python",
    html: "file_type_html",
    css: "file_type_css2",
    scss: "file_type_scss",
    json: "file_type_json",
    md: "file_type_markdown",
    svg: "file_type_svg",
    png: "file_type_image",
    jpg: "file_type_image",
    jpeg: "file_type_image",
    gif: "file_type_image",
    java: "file_type_java",
    cpp: "file_type_cpp2",
    cs: "file_type_csharp",
    go: "file_type_go",
    php: "file_type_php",
    rb: "file_type_ruby",
    rs: "file_type_rust",
    sh: "file_type_shell",
    vue: "file_type_vue",
    svelte: "file_type_svelte",
    xml: "file_type_xml",
    yml: "file_type_yaml",
    yaml: "file_type_yaml",
    sql: "file_type_sql",
    txt: "file_type_text",
    pdf: "file_type_pdf",
    zip: "file_type_zip",
    csv: "file_type_text",
};

export const getFileIcon = (fileName) => {
    const iconSize = 16;
    let iconName;

    iconName = iconMap[fileName.toLowerCase()];
    if (!iconName) {
        const ext = fileName.split('.').pop().toLowerCase();
        iconName = iconMap[ext];
    }

    if (!iconName) {
        iconName = "default_file";
    }
    const iconPath = `/vscode-icons/icons/${iconName}.svg`;

    // Returning JSX or path? The original component returned an <img> tag. 
    // It's safer to return the path or let the caller resolve it, but since we want to reuse the rendering logic,
    // let's return the icon name or path and let the component render the img.
    // Actually, to keep it simple, I'll export a component or just the path resolver.
    // The original code returned an <img> component. I'll make this function return the icon PATH string.

    return iconPath;
};
