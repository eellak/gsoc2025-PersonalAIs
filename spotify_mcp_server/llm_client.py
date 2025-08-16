import dashscope
from dashscope import Generation

class LLMClient:
    def __init__(self, dashscope_api_key):
        """
        Initialize the LLMClient with the DASHSCOPE API key.
        
        Args:
            dashscope_api_key (str): The API key for DashScope service.
        """
        self.api_key = dashscope_api_key
        dashscope.api_key = self.api_key

    def generate(self, prompt, model='qwen-turbo', **kwargs):
        """
        Generate text using the specified model.
        
        Args:
            prompt (str): The input prompt for text generation.
            model (str, optional): The model to use for generation. Defaults to 'qwen-turbo'.
            **kwargs: Additional arguments for the generation request.
            
        Returns:
            The response from the DashScope API.
        """
        try:
            response = Generation.call(
                model=model,
                prompt=prompt,
                **kwargs
            )
            return response
        except Exception as e:
            print(f"An error occurred during generation: {e}")
            return None
