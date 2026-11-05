package control

import (
	"strings"

	"github.com/a-h/templ"
)

type LoadingStateProps struct{ Label, Class string }
type EmptyStateProps struct{ Title, Description, Class string }

// TextFieldProps and SelectFieldProps connect label, hint and error IDs using
// the control's ID (or Name when ID is empty). Apps supply a meaningful name and
// label; shared defaults provide the surrounding accessible field markup.
type TextFieldProps struct {
	Label, Hint, Error, Class string
	Input                     InputProps
}
type SelectFieldProps struct {
	Label, Hint, Error, Class string
	Select                    SelectProps
}

func defaultText(value, fallback string) string {
	if value != "" {
		return value
	}
	return fallback
}
func stateAttributes(active bool, key string) templ.Attributes {
	if active {
		return templ.Attributes{key: "true"}
	}
	return nil
}
func descriptionAttributes(id string) templ.Attributes {
	if id != "" {
		return templ.Attributes{"aria-describedby": id}
	}
	return nil
}

// Combine convenience attributes before caller attributes so there is one
// effective ARIA value and explicit application bindings remain authoritative.
func controlAttributes(caller templ.Attributes, defaults ...templ.Attributes) templ.Attributes {
	attrs := templ.Attributes{}
	for _, values := range defaults {
		for key, value := range values {
			attrs[key] = value
		}
	}
	for key, value := range caller {
		attrs[key] = value
	}
	return attrs
}
func fieldIDAttributes(id, part string) templ.Attributes {
	if id != "" {
		return templ.Attributes{"id": id + "-" + part}
	}
	return nil
}
func fieldDescription(existing, id, hint, problem string) string {
	ids := strings.Fields(existing)
	if id != "" {
		if hint != "" {
			ids = append(ids, id+"-hint")
		}
		if problem != "" {
			ids = append(ids, id+"-error")
		}
	}
	return strings.Join(ids, " ")
}
func textFieldInput(p TextFieldProps) InputProps {
	input := p.Input
	if input.ID == "" {
		input.ID = input.Name
	}
	input.Invalid = input.Invalid || p.Error != ""
	input.DescribedBy = fieldDescription(input.DescribedBy, input.ID, p.Hint, p.Error)
	return input
}
func selectFieldInput(p SelectFieldProps) SelectProps {
	input := p.Select
	if input.ID == "" {
		input.ID = input.Name
	}
	input.Invalid = input.Invalid || p.Error != ""
	input.DescribedBy = fieldDescription(input.DescribedBy, input.ID, p.Hint, p.Error)
	return input
}
