#!/bin/bash

# Git Workflow Helper Script for HR Management Platform

echo "🚀 HR Management Platform - Git Workflow Helper"
echo "==============================================="
echo ""
echo "Select an option:"
echo "1) Create new feature branch"
echo "2) Create new bugfix branch"
echo "3) Create new hotfix branch"
echo "4) Finish current branch (merge to develop)"
echo "5) Create release branch"
echo "6) Show current branch status"
echo "7) Pull latest changes from develop"
echo ""

read -p "Enter your choice (1-7): " choice

case $choice in
    1)
        read -p "Enter feature name (e.g., user-export): " feature_name
        git checkout develop
        git pull origin develop
        git checkout -b "feature/$feature_name"
        echo "✅ Created feature/$feature_name branch"
        echo "📝 Make your changes, then commit with: git commit -m 'feat: your message'"
        ;;
    2)
        read -p "Enter bug description (e.g., fix-login): " bug_name
        git checkout develop
        git pull origin develop
        git checkout -b "bugfix/$bug_name"
        echo "✅ Created bugfix/$bug_name branch"
        echo "📝 Fix the bug, then commit with: git commit -m 'fix: your message'"
        ;;
    3)
        read -p "Enter hotfix description (e.g., critical-security): " hotfix_name
        git checkout main
        git pull origin main
        git checkout -b "hotfix/$hotfix_name"
        echo "✅ Created hotfix/$hotfix_name branch"
        echo "⚠️  This is a production fix! Test thoroughly!"
        echo "📝 Apply fix, then commit with: git commit -m 'hotfix: your message'"
        ;;
    4)
        current_branch=$(git branch --show-current)
        if [[ $current_branch == feature/* ]] || [[ $current_branch == bugfix/* ]]; then
            echo "Finishing $current_branch..."
            git push origin "$current_branch"
            echo "✅ Pushed $current_branch to origin"
            echo "📝 Now create a Pull Request on GitHub to merge into develop"
            echo "🔗 https://github.com/RarminR/hr-management-platform/pull/new/$current_branch"
        else
            echo "❌ You must be on a feature/* or bugfix/* branch"
        fi
        ;;
    5)
        read -p "Enter release version (e.g., 1.1.0): " version
        git checkout develop
        git pull origin develop
        git checkout -b "release/$version"
        echo "✅ Created release/$version branch"
        echo "📝 Prepare release, update version numbers, then merge to main"
        ;;
    6)
        echo "Current branch: $(git branch --show-current)"
        echo ""
        git status
        ;;
    7)
        git checkout develop
        git pull origin develop
        echo "✅ Updated develop branch with latest changes"
        ;;
    *)
        echo "❌ Invalid option"
        ;;
esac