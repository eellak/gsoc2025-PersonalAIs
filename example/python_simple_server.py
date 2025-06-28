# server.py
from fastmcp import FastMCP

mcp = FastMCP("Demo 🚀")

@mcp.tool
def minus(a: int, b: int) -> int:
    """minus two numbers"""
    return a - b

if __name__ == "__main__":
    mcp.run()