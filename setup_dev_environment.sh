#!/bin/bash

# Setup script for Zone Heater Manager development environment
# This script installs Homebrew and Docker Desktop on macOS

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Zone Heater Manager Dev Setup${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${RED}Error: This script is designed for macOS${NC}"
    echo "For other platforms, please install Docker Desktop manually:"
    echo "  - Windows: https://docs.docker.com/desktop/install/windows-install/"
    echo "  - Linux: https://docs.docker.com/desktop/install/linux-install/"
    exit 1
fi

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo -e "${YELLOW}Homebrew not found. Installing Homebrew...${NC}"
    echo ""
    
    # Install Homebrew
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Add Homebrew to PATH for Apple Silicon Macs
    if [[ $(uname -m) == 'arm64' ]]; then
        echo -e "${BLUE}Configuring Homebrew for Apple Silicon...${NC}"
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
    
    echo -e "${GREEN}✓${NC} Homebrew installed successfully"
else
    echo -e "${GREEN}✓${NC} Homebrew already installed"
    
    # Update Homebrew
    echo -e "${BLUE}Updating Homebrew...${NC}"
    brew update
fi

echo ""

# Check if Docker is installed
if brew list --cask docker &> /dev/null; then
    echo -e "${GREEN}✓${NC} Docker Desktop already installed"
else
    echo -e "${YELLOW}Installing Docker Desktop...${NC}"
    echo "This may take several minutes..."
    echo ""
    
    brew install --cask docker
    
    echo -e "${GREEN}✓${NC} Docker Desktop installed successfully"
fi

echo ""

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${YELLOW}Docker Desktop is not running.${NC}"
    echo ""
    echo "Please:"
    echo "  1. Open Docker Desktop from Applications or use:"
    echo -e "     ${BLUE}open -a Docker${NC}"
    echo "  2. Wait for Docker to start (whale icon in menu bar)"
    echo "  3. Accept any prompts for system access"
    echo ""
    echo -e "${BLUE}Starting Docker Desktop...${NC}"
    open -a Docker
    
    echo "Waiting for Docker to start..."
    i=0
    while ! docker info &> /dev/null && [ $i -lt 60 ]; do
        sleep 2
        i=$((i+1))
        echo -n "."
    done
    echo ""
    
    if docker info &> /dev/null; then
        echo -e "${GREEN}✓${NC} Docker Desktop is now running"
    else
        echo -e "${YELLOW}Docker Desktop is taking longer to start.${NC}"
        echo "Please wait for it to fully start, then continue."
        exit 0
    fi
else
    echo -e "${GREEN}✓${NC} Docker Desktop is running"
fi

echo ""

# Check if VS Code is installed
if ! command -v code &> /dev/null; then
    echo -e "${YELLOW}VS Code command 'code' not found${NC}"
    echo ""
    
    if [ -d "/Applications/Visual Studio Code.app" ]; then
        echo "VS Code is installed but the 'code' command is not in PATH."
        echo ""
        echo "To fix this:"
        echo "  1. Open VS Code"
        echo "  2. Press Cmd+Shift+P"
        echo "  3. Type: Shell Command: Install 'code' command in PATH"
        echo "  4. Press Enter"
    else
        echo "VS Code not found. Installing..."
        brew install --cask visual-studio-code
        echo -e "${GREEN}✓${NC} VS Code installed"
    fi
else
    echo -e "${GREEN}✓${NC} VS Code is installed"
fi

echo ""

# Check for VS Code Remote - Containers extension
echo -e "${BLUE}Checking VS Code extensions...${NC}"

if command -v code &> /dev/null; then
    if ! code --list-extensions | grep -q "ms-vscode-remote.remote-containers"; then
        echo "Installing Remote - Containers extension..."
        code --install-extension ms-vscode-remote.remote-containers
        echo -e "${GREEN}✓${NC} Remote - Containers extension installed"
    else
        echo -e "${GREEN}✓${NC} Remote - Containers extension already installed"
    fi
    
    if ! code --list-extensions | grep -q "ms-python.python"; then
        echo "Installing Python extension..."
        code --install-extension ms-python.python
        echo -e "${GREEN}✓${NC} Python extension installed"
    else
        echo -e "${GREEN}✓${NC} Python extension already installed"
    fi
else
    echo -e "${YELLOW}Skipping extension installation (VS Code command not available)${NC}"
    echo "Please install these extensions manually:"
    echo "  - Remote - Containers (ms-vscode-remote.remote-containers)"
    echo "  - Python (ms-python.python)"
fi

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "Next steps:"
echo ""
echo -e "1. ${BLUE}Ensure Docker Desktop is running${NC} (check menu bar)"
echo ""
echo -e "2. ${BLUE}Open this project in VS Code:${NC}"
echo -e "   ${BLUE}code .${NC}"
echo ""
echo -e "3. ${BLUE}Reopen in DevContainer:${NC}"
echo "   - Press Cmd+Shift+P"
echo "   - Select 'Remote-Containers: Reopen in Container'"
echo "   - Wait 5-10 minutes for first build"
echo ""
echo -e "4. ${BLUE}Start Home Assistant:${NC}"
echo "   - Press F5 to debug"
echo "   - Or run task: 'Run Home Assistant'"
echo ""
echo -e "5. ${BLUE}Access Home Assistant:${NC}"
echo -e "   ${BLUE}http://localhost:9123${NC}"
echo ""
echo "See .devcontainer/README.md for detailed instructions"
echo ""
