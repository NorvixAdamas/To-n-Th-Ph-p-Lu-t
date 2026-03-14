# PowerShell script to take screenshots of all pages using Edge WebDriver
$ErrorActionPreference = "Stop"

# Install Selenium if not already installed
if (-not (Get-Module -ListAvailable -Name Selenium)) {
    Write-Host "Installing Selenium module..."
    Install-Module -Name Selenium -Scope CurrentUser -Force -AllowClobber
}

Import-Module Selenium

# Create output directory for screenshots
$screenshotDir = Join-Path $PSScriptRoot "screenshots"
if (-not (Test-Path $screenshotDir)) {
    New-Item -ItemType Directory -Path $screenshotDir | Out-Null
}

# Pages to capture
$pages = @(
    @{ Name = "home"; URL = "http://localhost:3000/" },
    @{ Name = "muc-luc"; URL = "http://localhost:3000/muc-luc.html" },
    @{ Name = "intro"; URL = "http://localhost:3000/intro.html" },
    @{ Name = "cau-truc-luat-2026"; URL = "http://localhost:3000/cau-truc-luat-2026.html" },
    @{ Name = "search"; URL = "http://localhost:3000/search.html" }
)

Write-Host "Starting Edge WebDriver..."

try {
    # Create Edge options
    $options = New-Object OpenQA.Selenium.Edge.EdgeOptions
    $options.AddArgument("--headless")
    $options.AddArgument("--disable-gpu")
    $options.AddArgument("--window-size=1920,1080")
    
    # Start Edge driver
    $driver = New-Object OpenQA.Selenium.Edge.EdgeDriver($options)
    $driver.Manage().Timeouts().ImplicitWait = [TimeSpan]::FromSeconds(10)
    
    foreach ($page in $pages) {
        Write-Host "`nNavigating to $($page.Name): $($page.URL)"
        $driver.Navigate().GoToUrl($page.URL)
        
        # Wait for page to load
        Start-Sleep -Seconds 3
        
        # Take screenshot
        $screenshotPath = Join-Path $screenshotDir "$($page.Name).png"
        $screenshot = $driver.GetScreenshot()
        $screenshot.SaveAsFile($screenshotPath)
        
        Write-Host "Screenshot saved: $screenshotPath"
        
        # Get page title and body text length for verification
        $title = $driver.Title
        $bodyText = $driver.FindElement([OpenQA.Selenium.By]::TagName("body")).Text
        
        Write-Host "  Title: $title"
        Write-Host "  Body text length: $($bodyText.Length) characters"
    }
    
    Write-Host "`nAll screenshots captured successfully"
    Write-Host "Screenshots location: $screenshotDir"
    
} catch {
    Write-Host "Error occurred"
    Write-Host $_.Exception.Message
} finally {
    if ($driver) {
        $driver.Quit()
    }
}
