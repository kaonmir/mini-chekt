package smtp

import (
	"bytes"
	"fmt"
	"io"
	"mime"
	"mime/multipart"
	"net/mail"
	"strings"
)

// EmailPart represents a part of a multipart email
type EmailPart struct {
	ContentType string
	Content     []byte
	Headers     map[string]string
}

// ParseMultipartEmail parses a multipart email and returns an array of EmailPart
func ParseMultipartEmail(data []byte) ([]EmailPart, error) {
	var parts []EmailPart

	// Parse the email using net/mail
	msg, err := mail.ReadMessage(bytes.NewReader(data))
	if err != nil {
		return nil, fmt.Errorf("failed to read message: %v", err)
	}

	// Get the content type
	contentType := msg.Header.Get("Content-Type")

	// If not multipart, return as single part
	if !strings.Contains(contentType, "multipart") {
		body, err := io.ReadAll(msg.Body)
		if err != nil {
			return nil, fmt.Errorf("failed to read body: %v", err)
		}

		headers := make(map[string]string)
		for key, values := range msg.Header {
			headers[key] = values[0]
		}

		parts = append(parts, EmailPart{
			ContentType: contentType,
			Content:     body,
			Headers:     headers,
		})
		return parts, nil
	}

	// Parse multipart content
	_, params, err := mime.ParseMediaType(contentType)
	if err != nil {
		return nil, fmt.Errorf("failed to parse media type: %v", err)
	}

	boundary, ok := params["boundary"]
	if !ok {
		return nil, fmt.Errorf("no boundary found in multipart content type")
	}

	// Clean up boundary string (remove quotes if present)
	boundary = strings.Trim(boundary, `"'`)

	// Read the entire body first
	bodyBytes, err := io.ReadAll(msg.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read body: %v", err)
	}

	// Try to parse using multipart reader first
	parts, err = parseWithMultipartReader(bodyBytes, boundary)
	if err != nil {
		// If multipart reader fails, try manual parsing as fallback
		parts, err = parseManually(bodyBytes, boundary)
		if err != nil {
			return nil, fmt.Errorf("both multipart reader and manual parsing failed: %v", err)
		}
	}

	return parts, nil
}

// parseManually parses multipart content manually as a fallback
func parseManually(bodyBytes []byte, boundary string) ([]EmailPart, error) {
	var emailParts []EmailPart

	// Convert body to string for easier manipulation
	bodyStr := string(bodyBytes)

	// Split by boundary
	boundaryMarker := "--" + boundary
	sections := strings.Split(bodyStr, boundaryMarker)

	// Skip the first section if it's empty or doesn't contain content
	startIndex := 0
	if len(sections) > 0 && strings.TrimSpace(sections[0]) == "" {
		startIndex = 1
	}

	// Process each section
	for i := startIndex; i < len(sections); i++ {
		section := sections[i]

		// Skip empty sections or the final boundary
		if strings.TrimSpace(section) == "" || strings.TrimSpace(section) == "--" {
			continue
		}

		// Find the first double newline to separate headers from content
		sectionParts := strings.SplitN(section, "\r\n\r\n", 2)
		if len(sectionParts) < 2 {
			sectionParts = strings.SplitN(section, "\n\n", 2)
		}

		if len(sectionParts) < 2 {
			// If we can't find proper separation, treat the whole section as content
			content := strings.TrimSpace(section)
			if content != "" {
				emailParts = append(emailParts, EmailPart{
					ContentType: "text/plain",
					Content:     []byte(content),
					Headers:     make(map[string]string),
				})
			}
			continue
		}

		// Parse headers
		headers := make(map[string]string)
		headerLines := strings.Split(sectionParts[0], "\n")
		for _, line := range headerLines {
			line = strings.TrimSpace(line)
			if line == "" {
				continue
			}

			if strings.Contains(line, ":") {
				headerParts := strings.SplitN(line, ":", 2)
				if len(headerParts) == 2 {
					key := strings.TrimSpace(headerParts[0])
					value := strings.TrimSpace(headerParts[1])
					headers[key] = value
				}
			}
		}

		// Get content type
		contentType := headers["Content-Type"]
		if contentType == "" {
			contentType = "text/plain"
		}

		// Clean up content (remove trailing boundary markers)
		content := strings.TrimSpace(sectionParts[1])
		content = strings.TrimSuffix(content, "--")
		content = strings.TrimSpace(content)

		if content != "" {
			emailParts = append(emailParts, EmailPart{
				ContentType: contentType,
				Content:     []byte(content),
				Headers:     headers,
			})
		}
	}

	return emailParts, nil
}

// parseWithMultipartReader tries to parse using the standard multipart reader
func parseWithMultipartReader(bodyBytes []byte, boundary string) ([]EmailPart, error) {
	var parts []EmailPart

	mr := multipart.NewReader(bytes.NewReader(bodyBytes), boundary)

	for {
		part, err := mr.NextPart()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("failed to read next part: %v", err)
		}

		// Read the part content
		content, err := io.ReadAll(part)
		if err != nil {
			return nil, fmt.Errorf("failed to read part content: %v", err)
		}

		// Get part headers
		headers := make(map[string]string)
		for key, values := range part.Header {
			headers[key] = values[0]
		}

		// Get content type of this part
		partContentType := part.Header.Get("Content-Type")
		if partContentType == "" {
			partContentType = "text/plain"
		}

		parts = append(parts, EmailPart{
			ContentType: partContentType,
			Content:     content,
			Headers:     headers,
		})
	}

	return parts, nil
}
