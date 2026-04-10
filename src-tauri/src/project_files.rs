use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, Serialize)]
#[serde(tag = "type")]
pub enum FileTreeItem {
    File(FileItem),
    Folder(FolderItem),
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileItem {
    pub name: String,
    pub path: String,
    pub before: String,
    pub after: String,
    pub traits: Vec<String>,
    pub is_pinned: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FolderItem {
    pub name: String,
    pub path: String,
    pub items: Vec<FileTreeItem>,
    pub is_source: bool,
}

#[derive(Deserialize)]
struct SourceEntry {
    path: String,
}

#[derive(Deserialize)]
struct SourcesConfig {
    sources: Vec<SourceEntry>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectPaths {
    pub project_path: String,
    pub collections_path: String,
    pub actions_path: String,
    pub env_path: String,
    pub secrets_path: String,
}

#[tauri::command]
pub fn read_project_file_tree(paths: ProjectPaths) -> Result<Vec<FileTreeItem>, String> {
    let source_paths = load_source_paths(&paths.project_path, &paths.collections_path);
    let pinned_paths = load_pinned(&paths.project_path, &paths.collections_path);

    let pinned_items: Vec<FileTreeItem> = pinned_paths
        .iter()
        .filter(|p| {
            !p.is_empty()
        })
        .enumerate()
        .map(|(idx, p)| {
            let name = Path::new(p)
                .file_name()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string();

            let full_path = Path::new(&paths.project_path).join(&p);

            let mut traits = vec!["executable".into()];

            if idx == 0 {
                traits.push("shortcutExecutable".into());
            }

            make_item(&name_no_ext(name), &full_path, traits, true)
        })
        .collect();

    let collection_items = read_items(
        Path::new(&paths.collections_path),
        &source_paths,
        &pinned_paths,
    )
    .unwrap_or_default();
    let action_items = read_action_items(Path::new(&paths.actions_path));

    let mut all_items = pinned_items;
    all_items.extend(vec![
        FileTreeItem::Folder(FolderItem {
            name: "collections".into(),
            path: paths.collections_path,
            items: collection_items,
            is_source: false,
        }),
        FileTreeItem::Folder(FolderItem {
            name: "actions".into(),
            path: paths.actions_path,
            items: action_items,
            is_source: false,
        }),
        FileTreeItem::File(FileItem {
            name: "environments".into(),
            path: paths.env_path,
            before: String::new(),
            after: String::new(),
            traits: vec![],
            is_pinned: false,
        }),
        FileTreeItem::File(FileItem {
            name: "secrets".into(),
            path: paths.secrets_path,
            before: String::new(),
            after: String::new(),
            traits: vec![],
            is_pinned: false,
        }),
    ]);

    Ok(all_items)
}

fn read_items(
    dir: &Path,
    source_paths: &HashSet<String>,
    pinned_paths: &Vec<String>,
) -> std::io::Result<Vec<FileTreeItem>> {
    let mut files: Vec<(String, PathBuf)> = vec![];
    let mut folders: Vec<(String, PathBuf)> = vec![];

    for entry in fs::read_dir(dir)? {
        let entry = entry?;
        let name = entry.file_name().to_string_lossy().to_string();
        let path = entry.path();

        if name.starts_with('.')
            || name == "settings.json"
            || name == "source.yaml"
            || name.ends_with(".before.js")
            || name.ends_with(".after.js")
            || name.ends_with(".spec.yaml")
            || pinned_paths.contains(&path.to_string_lossy().to_string())
        {
            continue;
        }

        if path.is_dir() {
            folders.push((name, path));
        } else {
            files.push((name, path));
        }
    }

    files.sort_by(|a, b| a.0.to_lowercase().cmp(&b.0.to_lowercase()));
    folders.sort_by(|a, b| a.0.to_lowercase().cmp(&b.0.to_lowercase()));

    let mut result = vec![];

    for (name, path) in &files {
        result.push(make_item(name, path, vec!["pinable".into()], false));
    }

    for (name, path) in &folders {
        let path_str = path.to_string_lossy().to_string();
        let is_source = source_paths.contains(&path_str);
        let children = read_items(path, source_paths, pinned_paths).unwrap_or_default();
        result.push(FileTreeItem::Folder(FolderItem {
            name: name.clone(),
            path: path_str,
            items: children,
            is_source,
        }));
    }

    Ok(result)
}

fn make_item(name: &String, path: &Path, traits: Vec<String>, is_pinned: bool) -> FileTreeItem {
    let path_str = path.to_string_lossy().to_string();
    let base = match path_str.rfind('.') {
        Some(i) => path_str[..i].to_string(),
        None => path_str.clone(),
    };
    let before_path = format!("{}.before.js", base);
    let after_path = format!("{}.after.js", base);
    let display = match name.rfind('.') {
        Some(i) => name[..i].to_string(),
        None => name.clone(),
    };

    FileTreeItem::File(FileItem {
        name: display,
        path: path_str,
        before: if Path::new(&before_path).exists() {
            before_path
        } else {
            String::new()
        },
        after: if Path::new(&after_path).exists() {
            after_path
        } else {
            String::new()
        },
        traits: traits,
        is_pinned: is_pinned,
    })
}

fn read_action_items(dir: &Path) -> Vec<FileTreeItem> {
    let Ok(rd) = fs::read_dir(dir) else {
        return vec![];
    };
    let mut entries: Vec<(String, String)> = rd
        .filter_map(|e| e.ok())
        .filter_map(|e| {
            let name = e.file_name().to_string_lossy().to_string();
            if !e.path().is_dir() && name.ends_with(".action.js") {
                Some((
                    name[..name.len() - ".action.js".len()].to_string(),
                    e.path().to_string_lossy().to_string(),
                ))
            } else {
                None
            }
        })
        .collect();
    entries.sort_by(|a, b| a.0.to_lowercase().cmp(&b.0.to_lowercase()));
    entries
        .into_iter()
        .map(|(name, path)| {
            FileTreeItem::File(FileItem {
                name,
                path,
                before: String::new(),
                after: String::new(),
                traits: vec!["executable".into()],
                is_pinned: false,
            })
        })
        .collect()
}

#[tauri::command]
pub fn search_project_files(
    collections_path: String,
    query: String,
) -> Result<Vec<FileItem>, String> {
    let query_lower = query.to_lowercase();
    let mut results = vec![];
    collect_matching_files(Path::new(&collections_path), &query_lower, &mut results);
    Ok(results)
}

fn collect_matching_files(dir: &Path, query: &str, results: &mut Vec<FileItem>) {
    let Ok(entries) = fs::read_dir(dir) else {
        return;
    };

    for entry in entries.flatten() {
        let name = entry.file_name().to_string_lossy().to_string();
        let path = entry.path();

        if name.starts_with('.')
            || name == "settings.json"
            || name == "source.yaml"
            || name.ends_with(".before.js")
            || name.ends_with(".after.js")
            || name.ends_with(".spec.yaml")
        {
            continue;
        }

        if path.is_dir() {
            collect_matching_files(&path, query, results);
        } else {
            let path_str = path.to_string_lossy().to_string();
            if !query.is_empty() && !path_str.to_lowercase().contains(query) {
                continue;
            }
            let base = match path_str.rfind('.') {
                Some(i) => path_str[..i].to_string(),
                None => path_str.clone(),
            };
            let display_name = match name.rfind('.') {
                Some(i) => name[..i].to_string(),
                None => name,
            };
            results.push(FileItem {
                name: display_name,
                path: path_str,
                before: if Path::new(&format!("{}.before.js", base)).exists() {
                    format!("{}.before.js", base)
                } else {
                    String::new()
                },
                after: if Path::new(&format!("{}.after.js", base)).exists() {
                    format!("{}.after.js", base)
                } else {
                    String::new()
                },
                traits: vec![],
                is_pinned: false,
            });
        }
    }
}

fn load_source_paths(project_path: &str, collections_path: &str) -> HashSet<String> {
    let sources_path = PathBuf::from(project_path)
        .join(".postchi")
        .join("sources.json");
    let Ok(content) = fs::read_to_string(&sources_path) else {
        return HashSet::new();
    };
    let Ok(config) = serde_json::from_str::<SourcesConfig>(&content) else {
        return HashSet::new();
    };
    config
        .sources
        .into_iter()
        .map(|s| {
            PathBuf::from(collections_path)
                .join(&s.path)
                .to_string_lossy()
                .to_string()
        })
        .collect()
}

fn load_pinned(project_path: &str, collections_path: &str) -> Vec<String> {
    let pinned_path = PathBuf::from(project_path).join(".postchi").join("pinned");

    fs::read_to_string(pinned_path)
        .map(|content| {
            content
                .lines()
                .map(|s| s.to_string()) // Convert &str to owned String
                .collect()
        })
        .unwrap_or_else(|_| Vec::new())
}

fn name_no_ext(name: String) -> String {
    match name.rfind('.') {
        Some(i) => name[..i].to_string(),
        None => name.clone(),
    }
}
