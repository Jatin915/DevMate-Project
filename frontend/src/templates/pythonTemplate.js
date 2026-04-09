export const pythonTemplate = {
  'main.py': `# ── Main entry point ─────────────────────────────────────
def main():
    print("Python project ready.")


if __name__ == "__main__":
    main()
`,

  'solution.py': `# ── Write your solution here ─────────────────────────────


def solve():
    pass


if __name__ == "__main__":
    result = solve()
    print(result)
`,

  'requirements.txt': `# Add your dependencies here
# Example:
# requests==2.31.0
`,
}
