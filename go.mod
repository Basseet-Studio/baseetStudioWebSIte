module hugo-agency-web-demo

go 1.24.0

// The Hugo theme is configured in hugo.yaml. We avoid adding it as a go.mod requirement to
// prevent duplicate module import warnings. If you want to use the theme as a Go module,
// remove the 'theme' entry from hugo.yaml and add the require line back.

require github.com/writeonlycode/hugo-agency-web v0.0.0-20250709134630-9b263db5d8f2 // indirect
