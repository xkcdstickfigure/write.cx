const { DOMAIN } = process.env;

const escapeHTML = html => html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const siteHome = ({ name, username, about, picture, link, html, posts }) => `<!DOCTYPE html>
<html lang="en" hidden>
    <head>
        <title>${escapeHTML(name)}</title>
        ${picture ? `<link rel="icon" href="${picture}" />` : ``}
        <link rel="stylesheet" href="/assets/style.css" />
        <link rel="alternate" type="application/rss+xml" href="/feed.xml">
        <script type="module" src="https://cdn.skypack.dev/twind/shim"></script>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        ${html || ""}
    </head>
    <body>
        <div class="mx-auto py-16 px-8 max-w-6xl">
            <header class="md:w-72 md:fixed">
                ${picture ? `<img src="${picture}" alt="Profile picture" class="bg-gray-800 w-20 h-20 rounded-md" />` : `<div class="bg-gray-800 w-20 h-20 rounded-md"></div>`}
                <h1 class="text-2xl font-bold truncate mt-2">${escapeHTML(name)}</h1>
                <h2 class="text-xs text-gray-400 truncate">
                    ${username}.${DOMAIN}
                    <a href="/feed.xml" class="text-gray-600">[rss]</a>
                </h2>
                <p class="whitespace-pre-wrap truncate mt-4">${about ? escapeHTML(about) : "This mysterious user hasn't written anything about themselves here yet..."}</p>
                ${link ? `<p class="text-blue-500 text-xs truncate mt-1"><a href="https://${escapeHTML(link)}" target="_blank">${escapeHTML(link)}</a></p>` : ``}
            </header>
            <main class="md:ml-80 mt-8 md:mt-0 space-y-8">
                ${posts.map((post) => `<a href="/${post.slug}" class="block bg-gray-800 p-4 rounded-md">
                    <h2 class="text-2xl font-bold truncate">${post.title ? escapeHTML(post.title) : "Untitled Post"}</h2>
                    <p class="text-xs text-gray-400">${post.date}</p>
                    <p class="whitespace-pre-wrap truncate mt-4">${post.content ? escapeHTML(post.content) : "Preview not available"}</p>
                </a>`).join("\n")}
            </main>
        </div>
    </body>
</html>`;

const sitePost = ({ slug, title, date, content, site }) => `<!DOCTYPE html>
<html lang="en" hidden>
    <head>
        <title>${escapeHTML(`${title || "Untitled Post"} | ${site.name}`)}</title>
        ${site.picture ? `<link rel="icon" href="${site.picture}" />` : ``}
        <link rel="stylesheet" href="/assets/style.css" />
        <link rel="stylesheet" href="/assets/content.css" />
        <link rel="alternate" type="application/rss+xml" href="/feed.xml">
        <script type="module" src="https://cdn.skypack.dev/twind/shim"></script>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        ${site.html || ""}

        <meta name="og:title" content="${title ? escapeHTML(title) : "Untitled Post"}" />
        <meta name="og:site_name" content="${escapeHTML(site.name)}" />
        <meta name="og:image" content="https://${site.username}.${DOMAIN}/${slug}/card.png" />
        <meta name="twitter:card" content="summary_large_image" />
    </head>
    <body>
        <div class="mx-auto py-16 px-8 max-w-4xl">
            <h1 class="text-4xl font-bold">${title ? escapeHTML(title) : "Untitled Post"}</h1>

            <a href="/" class="flex mt-4">
                ${site.picture ? `<img src="${site.picture}" alt="Site picture" class="bg-gray-800 w-8 h-8 rounded-md" />` : `<div class="bg-gray-800 w-8 h-8 rounded-md"></div>`}
                <div class="flex flex-col ml-2 -mt-0.5">
                    <h2 class="text-sm font-bold">${escapeHTML(site.name)}</h2>
                    <h3 class="text-xs text-gray-400">${site.username}.${DOMAIN}</h3>
                </div>
            </a>

            <div class="content space-y-4 mt-8">${content || "<p>The author hasn't written anything in here yet.</p>"}</div>

            <div class="mt-8">
                <p class="text-xs text-gray-200">${site.username}.${DOMAIN}/${slug}</p>
                <p class="text-xs text-gray-400">Published on ${date}</p>
            </div>
        </div>
    </body>
</html>`;

const feed = ({ name, username, picture, about, posts }) => `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0">
    <channel>
        <title>${escapeHTML(name)}</title>
        <description>${escapeHTML(about)}</description>
        <link>https://${username}.${DOMAIN}</link>
        <image>
            <title>${escapeHTML(name)}</title>
            <url>${picture}</url>
            <width>128</width>
            <height>128</height>
        </image>
        ${posts.map(post => `<item>
            <title>${post.title ? escapeHTML(post.title) : "Untitled Post"}</title>
            <link>https://${username}.${DOMAIN}/${post.slug}</link>
            <description>${post.content ? escapeHTML(post.content) : "Preview not available"}</description>
            <pubDate>${post.date}</pubDate>
            <guid>${username}.${DOMAIN}/${post.slug}</guid>
        </item>`).join("\n")}
    </channel>
</rss>`;

const home = () => `<!DOCTYPE html>
<html lang="en" hidden>
    <head>
        <title>${DOMAIN} - make a blog</title>
        <link rel="stylesheet" href="/assets/style.css" />
        <link rel="stylesheet" href="/assets/home.css" />
        <script type="module" src="https://cdn.skypack.dev/twind/shim"></script>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
    </head>
    <body>
        <div class="mx-auto pt-32 pb-16 px-4 sm:px-16 max-w-7xl lg:flex lg:space-x-8">
            <div class="lg:flex-grow">
                <h1 class="text-6xl sm:text-8xl font-bold text-blue-800"><span class="write">${DOMAIN}</span></h1>
                <h2 class="text-lg font-bold mt-2 tracking-wider">
                    <span class="text-gray-200">make a blog</span>
                    <span class="text-gray-400">(without ads!)</span>
                </h2>

                <p class="text-xl mt-8">
                    <strong>$20</strong>
                    one-time payment
                </p>
                <ul class="text-gray-400 list-disc list-inside">
                    <li>yes, really. no subscription.</li>
                    <li>supports markdown and rss</li>
                    <li>add custom html/js/css</li>
                    <li>export whenever you want</li>
                    <li>email/discord/twitter for help or feedback</li>
                    <li>most profits donated to <a href="https://admin.${DOMAIN}/charity" class="dev text-white relative pb-0.5">good causes</a></li>
                </ul>
                
                <div class="mt-8">
                    <p class="text-xl">for the price of a cup of coffee! ☕</p>
                    <p class="text-sm text-gray-400">(if you buy super overpriced coffee)</p>
                </div>

                <a href="/register" style="background: #C026D3" class="flex flex-col justify-center h-8 w-48 text-center rounded-md mt-8">sign up</a>
                <a href="/login" class="bg-gray-800 flex flex-col justify-center h-8 w-48 text-center rounded-md mt-2">sign in</a>

                <p class="text-xs text-gray-400 mt-2">
                    <a href="https://admin.${DOMAIN}/terms" target="_blank">terms of use</a>
                    <span class="text-gray-600">|</span>
                    <a href="https://admin.${DOMAIN}/privacy" target="_blank">privacy policy</a>
                </p>
            </div>

            <div class="w-full max-w-2xl mt-16">
                <div class="bg-black rounded-t-md py-2 px-16">
                    <div class="bg-gray-900 mx-auto h-5 w-96 max-w-full rounded-full flex justify-center text-gray-400 py-1">
                        <svg class="h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" fill="currentColor"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        <span class="text-xs font-light leading-none ml-1">taylor.${DOMAIN}</span>
                    </div>
                </div>
                <div class="h-96 overflow-hidden bg-gray-800 rounded-b-md flex p-8">
                    <header class="w-40 flex-shrink-0">
                        <img src="/assets/taylor.webp" alt="Profile picture" class="bg-gray-800 w-20 h-20 rounded-md" />
                        <h1 class="text-2xl font-bold mt-2">Taylor Klein</h1>
                        <h2 class="text-xs text-gray-400">taylor.${DOMAIN}</h2>
                        <p class="mt-4">Go dev, guitarist, Apple fanboy 🇬🇧 🏳️‍🌈</p>
                        <p class="text-blue-500 text-xs mt-1"><a href="/taylor">taylorklein.org/about</a></p>
                    </header>
                    <main class="flex-grow ml-8 space-y-8">
                        <div class="bg-gray-700 p-4 rounded-md">
                            <h2 class="text-2xl font-bold">Is Deno ready to replace Node?</h2>
                            <p class="text-xs text-gray-400">July 8th 2022</p>
                            <p class="text-sm whitespace-pre-wrap mt-4">Deno first caught my attention last November when a friend mentioned it to me, and after a bit of research, it became clear that this was the future of server-side JavaScript.\n\nHowever, when I first tried it out, I felt the ecosystem simply wasn't ready. My database library of choice, Prisma...</p>
                        </div>
                        <div class="bg-gray-700 p-4 rounded-md">
                            <h2 class="text-2xl font-bold">M1 MacBook Pro Review</h2>
                            <p class="text-xs text-gray-400">April 23rd 2022</p>
                            <p class="text-sm whitespace-pre-wrap mt-4">Despite my initial scepticism towards Apple's claims, the M1 MBP is undoubtedly my favourite...</p>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    </body>
</html>`;

const login = ({ username, error, csrf }) => `<!DOCTYPE html>
<html lang="en" hidden>
    <head>
        <title>sign in to ${DOMAIN}</title>
        <link rel="stylesheet" href="/assets/style.css" />
        <script type="module" src="https://cdn.skypack.dev/twind/shim"></script>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
    </head>
    <body>
        <div class="mx-auto w-96 mt-32">
            <div
                style="background: linear-gradient(to right, #C026D3 40%, #1E40AF 80%)"
                class="h-1 w-full"
            ></div>
            <div class="bg-gray-800 p-8">
                <h1 class="text-2xl font-bold">sign in to ${DOMAIN}</h1>
                <form method="POST" class="mt-4 space-y-2">
                    <input name="username" value="${username ? escapeHTML(username) : ""}" placeholder="username or email" class="bg-gray-700 w-full h-12 px-4 text-lg placeholder-gray-400 rounded-md" />
                    <input name="password" type="password" placeholder="password" class="bg-gray-700 w-full h-12 px-4 text-lg placeholder-gray-400 rounded-md" />
                    <input name="_csrf" value="${csrf}" type="hidden" />
                    <button style="background: #C026D3" class="w-full h-12 text-lg rounded-md">sign in</button>
                </form>
            </div>

            ${error ? `<div
                style="background: #991b1b40; border-color: #7f1d1d80;"
                class="border text-red-500 py-2 px-4 mt-4"
            >
                <p>Those credentials didn't work. Try again.</p>
            </div>` : ``}
        </div>
    </body>
</html>`;

const register = ({ name, username, email, error, csrf }) => `<!DOCTYPE html>
<html lang="en" hidden>
    <head>
        <title>join ${DOMAIN}</title>
        <link rel="stylesheet" href="/assets/style.css" />
        <script type="module" src="https://cdn.skypack.dev/twind/shim"></script>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
    </head>
    <body>
        <div class="mx-auto w-96 mt-32">
            <div
                style="background: linear-gradient(to right, #C026D3 40%, #1E40AF 80%)"
                class="h-1 w-full"
            ></div>
            <div class="bg-gray-800 p-8">
                <h1 class="text-2xl font-bold">join ${DOMAIN}</h1>
                <form method="POST" class="mt-4 space-y-2">
                    <input name="name" value="${name ? escapeHTML(name) : ""}" placeholder="name" class="bg-gray-700 w-full h-12 px-4 text-lg placeholder-gray-400 rounded-md" />
                    <input name="username" value="${username ? escapeHTML(username) : ""}" placeholder="username" class="bg-gray-700 w-full h-12 px-4 text-lg placeholder-gray-400 rounded-md" />
                    <input name="email" value="${email ? escapeHTML(email) : ""}" placeholder="email" class="bg-gray-700 w-full h-12 px-4 text-lg placeholder-gray-400 rounded-md" />
                    <input name="password" type="password" placeholder="password" class="bg-gray-700 w-full h-12 px-4 text-lg placeholder-gray-400 rounded-md" />
                    <input name="_csrf" value="${csrf}" type="hidden" />
                    <button style="background: #C026D3" class="w-full h-12 text-lg rounded-md">continue</button>
                    <p class="text-xs text-gray-400">you'll be able to try out most of the service before paying, but your site won't be accessible until the account is activated.</p>
                </form>
            </div>

            ${error ? `<div
                style="background: #991b1b40; border-color: #7f1d1d80;"
                class="border text-red-500 py-2 px-4 mt-4"
            >
                <p>${error === "fields_empty" ? "Please fill in all fields." : error === "name_max_length" ? "The name you entered is too long." : error === "username_max_length" ? "The username you entered is too long." : error === "username_min_length" ? "The username you entered is too short." : error === "email_max_length" ? "The email you entered is too long." : error === "username_chars" ? "Usernames can only contain letters and numbers." : error === "email_chars" ? "That doesn't look like a valid email address." : error === "generic" ? "You can't create an account right now." : error === "username_taken" ? "That username isn't available." : "Something went wrong."}</p>
            </div>` : ``}

            <p class="text-xs text-gray-400 text-center mt-4">
                <a href="https://admin.${DOMAIN}/terms" target="_blank">terms of use</a>
                <span class="text-gray-600">|</span>
                <a href="https://admin.${DOMAIN}/privacy" target="_blank">privacy policy</a>
            </p>
        </div>
    </body>
</html>`;

const dashboard = ({ name, username, email, about, picture, link, posts, tip, activated, csrf }) => `<!DOCTYPE html>
<html lang="en" hidden>
    <head>
        <title>${DOMAIN} - dashboard</title>
        <link rel="stylesheet" href="/assets/style.css" />
        <script type="module" src="https://cdn.skypack.dev/twind/shim"></script>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
    </head>
    <body>
        <div class="mx-auto py-16 px-8 max-w-6xl md:flex">
            <header class="md:w-72 md:flex-shrink-0 space-y-4">
                <div>
                    <div class="flex">
                        ${picture ? `<img src="${picture}" alt="Profile picture" class="bg-gray-800 w-20 h-20 rounded-md" />` : `<div class="bg-gray-800 w-20 h-20 rounded-md"></div>`}
                        <div class="ml-4 flex flex-col justify-center">
                            <button
                                onclick="document.querySelector('input[name=pictureFile]').click()"
                                class="bg-gray-800 h-8 w-8 rounded-full text-xl text-gray-400"
                            >+</button>
                        </div>
                    </div>
                    <h1 class="text-2xl font-bold truncate mt-2">${escapeHTML(name)}</h1>
                    <h2 class="text-xs text-gray-400 truncate">${escapeHTML(email)}</h2>

                    <form action="/picture" method="POST" class="hidden">
                        <input
                            name="pictureFile"
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                        />
                        <input name="picture" type="hidden" />
                        <input name="_csrf" value="${csrf}" type="hidden" />
                    </form>
                </div>

                <div>
                    <p class="whitespace-pre-wrap truncate">${about ? escapeHTML(about) : "Edit your profile and write something in the about field, it'll go here!"}</p>
                    ${link ? `<p class="text-blue-500 text-xs truncate mt-1"><a href="https://${escapeHTML(link)}" target="_blank">${escapeHTML(link)}</a></p>` : ``}
                </div>

                <div class="space-y-2">
                    <a href="/new" class="bg-gray-800 flex flex-col justify-center h-8 w-full text-center rounded-md">New Post</a>
                    <a href="/profile" class="bg-gray-800 flex flex-col justify-center h-8 w-full text-center rounded-md">Edit Profile</a>
                    <a href="/email" class="bg-gray-800 flex flex-col justify-center h-8 w-full text-center rounded-md">Change Email</a>
                    <a href="/password" class="bg-gray-800 flex flex-col justify-center h-8 w-full text-center rounded-md">Change Password</a>
                    <a href="/html" class="bg-gray-800 flex flex-col justify-center h-8 w-full text-center rounded-md">Set Custom HTML</a>
                    <a href="/logout" class="bg-gray-800 flex flex-col justify-center h-8 w-full text-center rounded-md">Sign Out</a>
                </div>

                <div class="bg-gray-800 p-4 rounded-md">
                    <h2 class="text-xl font-bold">${activated ? `This is your dashboard ✨` : `Activate your account`}</h2>
                    <p class="text-sm text-gray-400 mt-1">${activated ? "From here, you can manage everything about your site. It has things that only you can see, like unpublished posts or account information." : "You haven't activated your account, so your site isn't accessible and your account may be deleted after some time. It's just a one-time payment and you're supporting an indie dev :)"}</p>
                    <a ${activated ? `href="https://${username}.${DOMAIN}" target="_blank"` : `href="/activate"`} style="background: #C026D3" class="flex flex-col justify-center h-8 w-full text-center rounded-md mt-4">${activated ? "View your site" : "Activate for $20"}</a>
                </div>
            </header>

            <main class="md:ml-8 mt-8 md:mt-0 md:flex-grow">
                ${posts.length > 0 ? `<div class="space-y-4 mb-8">
                    ${posts.map((post) => `<a href="/post/${post.slug}" class="block">
                        <h2 class="text-2xl font-bold truncate">${post.title ? escapeHTML(post.title) : "Untitled Post"}</h2>
                        <div class="flex mt-1">
                            <span class="text-sm text-gray-400">${post.date}</span>
                            ${post.draft ? `<span class="bg-gray-700 py-0.5 px-2 rounded-md text-xs text-uppercase ml-2">draft</span>` : ``}
                        </div>
                    </a>`).join("\n")}
                </div>` : ``}

                <div class="bg-gray-800 p-4 rounded-md text-sm">
                    <div class="flex">
                        <p class="font-bold whitespace-pre mr-2">💡 Tip</p>
                        <p class="text-gray-400">${tip || `Follow <a href="https://twitter.com/WriteCX" target="_blank" class="text-blue-500">@WriteCX</a> on Twitter for support, updates and fancy new things!`}</p>
                    </div>
                </div>
                
                <p class="text-xs text-gray-400 text-center mt-4">
                    Get help and tell me what you think on
                    <a href="https://twitter.com/WriteCX" target="_blank" class="text-blue-500">Twitter</a>
                    or
                    <a href="https://discord.gg/PCBwf87fM9" target="_blank" class="text-blue-500">Discord</a>.
                    Have a great day!
                </p>
            </main>
        </div>
        <script src="/assets/dashboard.js"></script>
    </body>
</html>`;

const profile = ({ name, about, link, csrf }) => `<!DOCTYPE html>
<html lang="en" hidden>
    <head>
        <title>${DOMAIN} - edit profile</title>
        <link rel="stylesheet" href="/assets/style.css" />
        <script type="module" src="https://cdn.skypack.dev/twind/shim"></script>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
    </head>
    <body>
        <div class="mx-auto w-96 mt-32">
            <div
                style="background: linear-gradient(to right, #C026D3 40%, #1E40AF 80%)"
                class="h-1 w-full"
            ></div>
            <div class="bg-gray-800 p-8">
                <h1 class="text-2xl font-bold">edit profile</h1>
                <form method="POST" class="mt-4 space-y-2">
                    <input name="name" value="${escapeHTML(name)}" placeholder="name" class="bg-gray-700 w-full h-12 px-4 text-lg placeholder-gray-400 rounded-md" />
                    <input name="link" value="${link ? escapeHTML(link) : ""}" placeholder="link" class="bg-gray-700 w-full h-12 px-4 text-lg placeholder-gray-400 rounded-md" />
                    <textarea name="about" placeholder="about" class="bg-gray-700 w-full h-32 pt-3 px-4 text-lg placeholder-gray-400 rounded-md resize-none">${about ? escapeHTML(about) : ""}</textarea>
                    <input name="_csrf" value="${csrf}" type="hidden" />
                    <button style="background: #C026D3" class="w-full h-12 text-lg rounded-md">save</button>
                </form>
            </div>
        </div>
    </body>
</html>`;

const email = ({ email, csrf }) => `<!DOCTYPE html>
<html lang="en" hidden>
    <head>
        <title>${DOMAIN} - change email</title>
        <link rel="stylesheet" href="/assets/style.css" />
        <script type="module" src="https://cdn.skypack.dev/twind/shim"></script>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
    </head>
    <body>
        <div class="mx-auto w-96 mt-32">
            <div
                style="background: linear-gradient(to right, #C026D3 40%, #1E40AF 80%)"
                class="h-1 w-full"
            ></div>
            <div class="bg-gray-800 p-8">
                <h1 class="text-2xl font-bold">change email</h1>
                <form method="POST" class="mt-4 space-y-2">
                    <input name="email" value="${escapeHTML(email)}" placeholder="email address" class="bg-gray-700 w-full h-12 px-4 text-lg placeholder-gray-400 rounded-md" />
                    <input name="_csrf" value="${csrf}" type="hidden" />
                    <button style="background: #C026D3" class="w-full h-12 text-lg rounded-md">save</button>
                </form>
            </div>
        </div>
    </body>
</html>`;

const password = ({ error, csrf }) => `<!DOCTYPE html>
<html lang="en" hidden>
    <head>
        <title>${DOMAIN} - change password</title>
        <link rel="stylesheet" href="/assets/style.css" />
        <script type="module" src="https://cdn.skypack.dev/twind/shim"></script>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
    </head>
    <body>
        <div class="mx-auto w-96 mt-32">
            <div
                style="background: linear-gradient(to right, #C026D3 40%, #1E40AF 80%)"
                class="h-1 w-full"
            ></div>
            <div class="bg-gray-800 p-8">
                <h1 class="text-2xl font-bold">change password</h1>
                <form method="POST" class="mt-4 space-y-2">
                    <input name="old" type="password" placeholder="old password" class="bg-gray-700 w-full h-12 px-4 text-lg placeholder-gray-400 rounded-md" />
                    <input name="password" type="password" placeholder="new password" class="bg-gray-700 w-full h-12 px-4 text-lg placeholder-gray-400 rounded-md" />
                    <input name="password2" type="password" placeholder="confirm new password" class="bg-gray-700 w-full h-12 px-4 text-lg placeholder-gray-400 rounded-md" />
                    <input name="_csrf" value="${csrf}" type="hidden" />
                    <button style="background: #C026D3" class="w-full h-12 text-lg rounded-md">save</button>
                </form>
            </div>

            ${error ? `<div
                style="background: #991b1b40; border-color: #7f1d1d80;"
                class="border text-red-500 py-2 px-4 mt-4"
            >
                <p>${error === "old" ? "Your old password was incorrect." : error === "match" ? "Your new passwords didn't match." : "Something went wrong."} Try again.</p>
            </div>` : ``}
        </div>
    </body>
</html>`;

const customHtml = ({ html, csrf }) => `<!DOCTYPE html>
<html lang="en" hidden>
    <head>
        <title>${DOMAIN} - set custom html</title>
        <link rel="stylesheet" href="/assets/style.css" />
        <script type="module" src="https://cdn.skypack.dev/twind/shim"></script>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
    </head>
    <body>
        <div class="mx-auto w-96 mt-32">
            <div
                style="background: linear-gradient(to right, #C026D3 40%, #1E40AF 80%)"
                class="h-1 w-full"
            ></div>
            <div class="bg-gray-800 p-8">
                <h1 class="text-2xl font-bold">set custom html</h1>
                <form method="POST" class="mt-4 space-y-2">
                    <textarea name="html" placeholder="html code" class="bg-gray-700 w-full h-32 pt-3 px-4 text-lg placeholder-gray-400 rounded-md resize-none">${html ? escapeHTML(html) : ""}</textarea>
                    <input name="_csrf" value="${csrf}" type="hidden" />
                    <button style="background: #C026D3" class="w-full h-12 text-lg rounded-md">save</button>
                    <p class="text-xs text-gray-400">code is added into the &lt;head&gt; of pages on your site</p>
                </form>
            </div>
        </div>
    </body>
</html>`;

const logout = ({ csrf }) => `<!DOCTYPE html>
<html lang="en" hidden>
    <head>
        <title>${DOMAIN} - sign out</title>
        <link rel="stylesheet" href="/assets/style.css" />
        <script type="module" src="https://cdn.skypack.dev/twind/shim"></script>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
    </head>
    <body>
        <div class="mx-auto w-96 mt-32">
            <div class="bg-red-500 h-1 w-full"></div>
            <div class="bg-gray-800 p-8">
                <h1 class="text-2xl font-bold">sign out?</h1>
                <form method="POST" class="mt-4 space-y-2">
                    <input name="_csrf" value="${csrf}" type="hidden" />
                    <button class="bg-red-500 w-full h-12 text-lg rounded-md">confirm</button>
                </form>
                <a href="/dashboard" class="bg-gray-700 flex flex-col justify-center w-full h-12 text-lg text-center rounded-md mt-2">nevermind</a>
            </div>
        </div>
    </body>
</html>`;

const newPost = ({ username, error, csrf }) => `<!DOCTYPE html>
<html class="h-full" lang="en" hidden>
    <head>
        <title>${DOMAIN} - new post</title>
        <link rel="stylesheet" href="/assets/style.css" />
        <script type="module" src="https://cdn.skypack.dev/twind/shim"></script>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
    </head>
    <body class="h-full flex flex-col justify-center items-center">
        <form method="POST" class="relative flex">
            <p class="absolute -top-6 text-sm text-gray-400">what url would you like to give this post?</p>

            <p class="text-2xl md:text-4xl font-bold">${username}.${DOMAIN}/</p>
            <input
                name="slug"
                placeholder="new-post"
                autofocus
                maxlength="32"
                class="bg-transparent outline-none w-48 text-2xl md:text-4xl font-bold text-gray-400 placeholder-gray-600"
            />
            <input name="_csrf" value="${csrf}" type="hidden" />

            <div class="absolute flex justify-between -bottom-8 w-full">
                <a href="/dashboard">go back</a>
                <button>hit <strong class="text-blue-500">enter</strong> to continue</button>
            </div>

            ${error ? `<div class="absolute -bottom-24 w-full">
                <div class="flex justify-center">
                    <div
                        style="background: #991b1b40; border-color: #7f1d1d80;"
                        class="border text-red-500 py-2 px-4 mx-auto"
                    >
                        <p>${error === "length" ? "That's a bit too long." : error === "chars" ? "You can only use letters, numbers and hyphens." : error === "unique" ? "You've used that url before. Try another one." : "Something went wrong."}</p>
                    </div>
                </div>
            </div>` : ``}
        </form>
        <script src="/assets/new.js"></script>
    </body>
</html>`;

const viewPost = ({ slug, username, title, content, draft, views, csrf }) => `<!DOCTYPE html>
<html lang="en" hidden>
    <head>
        <title>${title ? escapeHTML(title) : "Untitled Post"}</title>
        <link rel="stylesheet" href="/assets/style.css" />
        <link rel="stylesheet" href="/assets/content.css" />
        <script type="module" src="https://cdn.skypack.dev/twind/shim"></script>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
    </head>
    <body>
        <div class="mx-auto py-16 px-8 max-w-4xl">
            <div class="flex justify-between text-xs text-gray-400">
                <p><a href="/dashboard">🡠 Back to Dashboard</a></p>
                <p>
                    <a href="/post/${slug}/edit">Edit</a>
                    <span class="text-gray-600">|</span>
                    <a href="/post/${slug}/delete">Delete</a>
                </p>
            </div>

            <div class="bg-gray-800 py-2 px-4 rounded-md mt-2 flex">
                ${draft ? `<p class="flex-grow my-auto">You're viewing a <strong>draft</strong> - only you can see this post.</p>
                <form action="/post/${slug}/publish" method="POST" class="ml-4">
                    <input name="_csrf" value="${csrf}" type="hidden" />
                    <button style="background: #C026D3" class="h-8 px-2 rounded-md">Publish</button>
                </form>` : `<p class="flex-grow my-auto">You're viewing a preview of this post, but it's published on your site.</p>
                <div class="bg-gray-700 h-8 px-2 rounded-md text-gray-400 my-auto ml-4 flex">
                    <svg class="h-4 w-4 my-auto" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    <p class="text-sm my-auto ml-1">${views}</p>
                </div>
                <a href="https://${username}.${DOMAIN}/${slug}" target="_blank" style="background: #C026D3" class="flex flex-col justify-center h-8 px-2 rounded-md whitespace-pre my-auto ml-2">View Post</a>`}
            </div>

            <h1 class="text-4xl font-bold mt-8">${title ? escapeHTML(title) : "Untitled Post"}</h1>
            <div class="content space-y-4 mt-4">${content || "<p>You haven't written anything here yet.</p>"}</div>
        </div>
    </body>
</html>`;

const deletePost = ({ slug, csrf }) => `<!DOCTYPE html>
<html lang="en" hidden>
    <head>
        <title>${DOMAIN} - delete post</title>
        <link rel="stylesheet" href="/assets/style.css" />
        <script type="module" src="https://cdn.skypack.dev/twind/shim"></script>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
    </head>
    <body>
        <div class="mx-auto w-96 mt-32">
            <div class="bg-red-500 h-1 w-full"></div>
            <div class="bg-gray-800 p-8">
                <h1 class="text-2xl font-bold">delete post?</h1>
                <form method="POST" class="mt-4 space-y-2">
                    <input name="_csrf" value="${csrf}" type="hidden" />
                    <button class="bg-red-500 w-full h-12 text-lg rounded-md">confirm</button>
                </form>
                <a href="/post/${slug}" class="bg-gray-700 flex flex-col justify-center w-full h-12 text-lg text-center rounded-md mt-2">nevermind</a>
            </div>
        </div>
    </body>
</html>`;

const editPost = ({ slug, title, content, csrf }) => `<!DOCTYPE html>
<html class="h-full" lang="en" hidden>
    <head>
        <title>${title ? escapeHTML(title) : "Untitled Post"}</title>
        <link rel="stylesheet" href="/assets/style.css" />
        <link rel="stylesheet" href="/assets/content.css" />
        <script type="module" src="https://cdn.skypack.dev/twind/shim"></script>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
    </head>
    <body class="h-full">
        <form method="POST" class="mx-auto pt-16 p-8 h-full max-w-4xl flex flex-col">
            <input
                name="title"
                value="${title ? escapeHTML(title) : ""}"
                placeholder="Title"
                ${!title ? "autofocus" : ""}
                maxlength="64"
                class="bg-transparent outline-none w-full px-4 text-4xl font-bold placeholder-gray-600"
            />

            <textarea
                name="content"
                placeholder="Write something here..."
                ${title ? "autofocus" : ""}
                class="bg-transparent outline-none w-full flex-grow resize-none pb-8 px-4 placeholder-gray-600 mt-4"
            >${content ? escapeHTML(content) : ""}</textarea>

            <input name="_csrf" value="${csrf}" type="hidden" />

            <div class="bg-gray-800 py-2 px-4 rounded-md flex">
                <p class="flex-grow my-auto">Markdown formatting is supported!</p>
                <a href="/post/${slug}" class="bg-gray-700 flex flex-col justify-center h-8 px-2 rounded-md my-auto ml-2">Cancel</a>
                <button style="background: #C026D3" class="h-8 px-2 rounded-md my-auto ml-2">Save</a>
            </div>
        </form>
    </body>
</html>`;

module.exports = { siteHome, sitePost, feed, home, login, register, dashboard, profile, email, password, customHtml, logout, newPost, viewPost, deletePost, editPost };