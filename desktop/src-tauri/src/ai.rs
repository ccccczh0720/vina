use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiPolishInput {
    pub source_text: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AiPolishOutput {
    pub polished_text: Option<String>,
    pub status: AiPolishStatus,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum AiPolishStatus {
    Success,
    Failed,
    Disabled,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct AiConfig {
    provider: String,
    base_url: String,
    api_key: String,
    model: String,
    enabled: bool,
}

#[derive(Debug, Serialize)]
struct ChatRequest {
    model: String,
    messages: Vec<ChatMessage>,
    temperature: f32,
}

#[derive(Debug, Serialize, Deserialize)]
struct ChatMessage {
    role: String,
    content: String,
}

#[derive(Debug, Deserialize)]
struct ChatResponse {
    choices: Vec<ChatChoice>,
}

#[derive(Debug, Deserialize)]
struct ChatChoice {
    message: ChatMessage,
}

#[tauri::command]
pub async fn polish_interpretation(input: AiPolishInput) -> Result<AiPolishOutput, String> {
    let config = match load_ai_config() {
        Ok(config) => config,
        Err(_) => {
            return Ok(AiPolishOutput {
                polished_text: None,
                status: AiPolishStatus::Disabled,
            });
        }
    };

    if !config.enabled || config.api_key.trim().is_empty() || config.model.trim().is_empty() {
        return Ok(AiPolishOutput {
            polished_text: None,
            status: AiPolishStatus::Disabled,
        });
    }

    if config.provider != "openai-compatible" {
        return Err("Unsupported AI provider.".to_string());
    }

    let endpoint = format!("{}/v1/chat/completions", config.base_url.trim_end_matches('/'));
    let request = ChatRequest {
        model: config.model,
        temperature: 0.3,
        messages: vec![
            ChatMessage {
                role: "system".to_string(),
                content: "你只负责润色六爻规则解读文本。不得改变结论，不得新增排盘、卦象、六亲、六神或应期判断。输出自然、简洁的中文。".to_string(),
            },
            ChatMessage {
                role: "user".to_string(),
                content: input.source_text,
            },
        ],
    };

    let response = reqwest::Client::new()
        .post(endpoint)
        .bearer_auth(config.api_key)
        .json(&request)
        .send()
        .await
        .map_err(|error| error.to_string())?;

    if !response.status().is_success() {
        return Ok(AiPolishOutput {
            polished_text: None,
            status: AiPolishStatus::Failed,
        });
    }

    let body = response
        .json::<ChatResponse>()
        .await
        .map_err(|error| error.to_string())?;
    let polished_text = body
        .choices
        .into_iter()
        .next()
        .map(|choice| choice.message.content)
        .filter(|content| !content.trim().is_empty());

    Ok(AiPolishOutput {
        status: if polished_text.is_some() {
            AiPolishStatus::Success
        } else {
            AiPolishStatus::Failed
        },
        polished_text,
    })
}

fn load_ai_config() -> Result<AiConfig, String> {
    let candidates = [
        std::path::PathBuf::from("../config/ai.config.local.json"),
        std::path::PathBuf::from("../../config/ai.config.local.json"),
        std::env::var_os("APPDATA")
            .map(std::path::PathBuf::from)
            .map(|path| path.join("vina").join("ai.config.local.json"))
            .unwrap_or_default(),
    ];

    let path = candidates
        .iter()
        .find(|path| !path.as_os_str().is_empty() && path.exists())
        .ok_or_else(|| "AI config is missing.".to_string())?;
    let content = std::fs::read_to_string(path).map_err(|error| error.to_string())?;
    serde_json::from_str(&content).map_err(|error| error.to_string())
}
