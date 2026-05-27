#!/bin/bash

# Script para fazer push no GitHub
# Use: bash PUSH_GITHUB.sh

echo "🚀 Fazendo push para GitHub..."

cd "$(dirname "$0")"

# Configurar remote (se ainda não estiver)
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "Adicionando remote origin..."
    git remote add origin https://github.com/Guilhermearke/arke-creditos.git
fi

# Garantir que estamos na branch main
git branch -M main

# Fazer push
echo "Enviando código..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo "✅ Push bem-sucedido!"
    echo "📍 Seu repositório: https://github.com/Guilhermearke/arke-creditos"
else
    echo "❌ Erro ao fazer push"
    echo "💡 Se pedir login: use seu GitHub token no lugar da senha"
    exit 1
fi
