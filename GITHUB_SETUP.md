# GitHub Repository Setup Guide

## Required Repository Settings

### 1. Enable GitHub Actions
1. Go to **Settings** → **Actions** → **General**
2. Under "Actions permissions", select **Allow all actions and reusable workflows**
3. Click **Save**

### 2. Configure Permissions
1. Go to **Settings** → **Actions** → **General**
2. Scroll to **Workflow permissions**
3. Select **Read and write permissions**
4. Enable **Allow GitHub Actions to create and approve pull requests**
5. Click **Save**

### 3. Enable Security Features
1. Go to **Settings** → **Security and analysis**
2. Enable the following:
   - ✅ **Code scanning** (CodeQL)
   - ✅ **Dependabot alerts**
   - ✅ **Dependabot security updates**
   - ✅ **Secret scanning**

### 4. Branch Protection Rules (Optional but Recommended)
1. Go to **Settings** → **Branches**
2. Under **Branch protection rules**, click **Add rule**
3. Enter branch name pattern: `main`
4. Enable:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
5. Click **Create**

## Resolving Common Errors

### "Resource not accessible by integration"
**Solution**: Ensure workflow permissions are set to **Read and write** under Settings → Actions → General → Workflow permissions

### "Permission to access the CodeQL Action API endpoints"
**Solution**: The repository needs `security-events: write` permission in the workflow file (already configured in our updated workflows)

### SARIF Upload Issues
**Solution**: Ensure the SARIF file is valid and the token has proper permissions. Our updated workflows include proper error handling with `continue-on-error: true`

## Testing the Workflow

After making changes:
1. Push changes to your repository
2. Go to **Actions** tab
3. Verify all workflows pass
4. Check **Security** tab for scan results
