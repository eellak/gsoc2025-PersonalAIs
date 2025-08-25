from llm_clinet import LLMClient
import dotenv
import os

dotenv.load_dotenv()

API_KEY = os.getenv("DASHSCOPE_API_KEY")

client = LLMClient(API_KEY)

# response = client.generate("Tell me a joke")
# print(response)


activity = "nothing"
prompt = f"""
Based on the activity description: '{activity}', determine the appropriate valence and energy ranges for music recommendation.
Valence is a measure of musical positiveness (0.0 to 1.0, where higher values are more positive).
Energy is a measure of intensity and activity (0.0 to 1.0, where higher values are more energetic).
Return only a JSON object with 'valence_min', 'valence_max', 'energy_min', and 'energy_max' values, each between 0 and 1.
Do not include any additional text.
"""
response = client.generate(prompt)["output"]["text"]
print(response)
import json
json_response = json.loads(response)
print(json_response)
# save to file
with open("activity.json", "w") as f:
    json.dump(json_response, f)
