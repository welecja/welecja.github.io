# README

This guide is tailored for beginners and will help you add new blog posts and images to your site. Whether you're new to GitHub or Git, or just want to understand why we're using Jekyll, you're in the right place.

## Background
This site is set up such that there are some folders with content files (blog posts, images, etc). These are written using markdown, which is a an easy format for text. Then there are some scripts (simple computer programmes) that take these files and make them part of the website. In other words, you can add blogposts and images without knowing how to code!

## Why Precision Matters
Every time you upload or change files in your repository, GitHub Pages rebuilds your site. Precise naming, file placement, and syntax are crucial because:
- **Typos or Incorrect Naming**: Mistakes can prevent content from displaying correctly or at all.
- **Automated Processing**: Jekyll, the engine behind your GitHub Pages site, relies on specific naming conventions and directory structures to generate your site correctly.

## Adding Blog Posts

### 1. **Navigate to Your Repository**
1. Sign up and log in to GitHub and open your site's [repository](https://github.com/welecja/welecja.github.io).
2. Enable [multifactor authentication](https://docs.github.com/en/authentication/securing-your-account-with-two-factor-authentication-2fa/configuring-two-factor-authentication). This is crucial as Github repository access can give a hacker full control over the site. 
3. Make sure you have been added to the repository by the superadmin (in this case Konrad Urban).

### 2. Creating a New Blog Post
- Go to the `_posts` directory in your repository. This is where your blog posts are stored.
- Click on `Add file` > `Create new file`.

### 3. **Name Your File**
Use the format `YEAR-MONTH-DAY-title.md` (e.g., `2024-01-10-my-first-post.md`). Ensure the file extension is .md, which stands for Markdown. If the file name is malformatted, the post will not be displayed!

### 4. Writing Your Blog Post
- At the top of the file, add front matter. It should look like this:

  ```yaml
  ---
  title: "Your Post Title"
  categories: CATEGORY
  feature_image: "/assets/images/140lecie.jpg"
  ---
  ```

categories and feature_image are optional (see section to learn how to upload images). Below the front matter, write your blog post. You can use Markdown to format your text. See [Markdown Guide](https://www.markdownguide.org/basic-syntax/) for syntax help. Also see [Elements](elements.md) for what kind of elements (headers, maps, videos etc.) can be included in posts.

### 5. Saving Your Blog Post
- Scroll down to the bottom of the page.
- Under `Commit new file`, enter a title and optional description for your changes.
- Choose `Commit directly to the main branch` option.
- Click `Commit new file`.

### 6. Your Post is Live!
- GitHub Pages will automatically build and publish your site with the new post.
- It may take a few minutes for the changes to appear. Once done, you can see your post live on your site!

## Uploading and Adding Images
1. **Upload Images**: In the `assets/images` directory, use `Add file` > `Upload files` to upload images.
2. **Insert Images into Posts**: Use `{% include figure.html image="/assets/images/FILENAME.jpg" caption="CAPTION" width="WIDTH" height="HEIGHT" %}` in your post files. Replace `FILENAME.jpg`, `CAPTION`, `WIDTH`, and `HEIGHT` with your details.

## Warnings and Best Practices
- **Avoid Unnecessary File Changes**: Only modify files in `_posts`, `assets/images`, and `_pages`. Changes elsewhere WILL BREAK the entire site.
- **Use Authorized Images**: Ensure you have the rights to use and share any images you upload.

## Finalizing Changes
Commit your changes after adding posts or images. GitHub Pages will automatically update your site, which may take a few minutes.

## Additional Resources
- [GitHub Pages Documentation](https://pages.github.com/)
- [Jekyll Documentation](https://jekyllrb.com/docs/)
- [Markdown Guide](https://www.markdownguide.org/basic-syntax/)

## Getting Help
If you encounter issues or have questions, consider using an AI assistant like Poe or ChatGPT, and utilize your repository's `Issues` section.

## Why We're Using Jekyll
Jekyll, a static site generator, is excellent for archiving and future-proofing content due to its simplicity and reliance on plain text files. This approach ensures long-term accessibility and resilience over time. Content in Jekyll is typically written in Markdown, making it human-readable and editable with basic text editors. This format, unlike dynamic websites, is less prone to technological obsolescence, making Jekyll a wise choice for creating websites and digital content intended for long-term preservation.
