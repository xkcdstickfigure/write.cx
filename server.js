const db = require("./prisma");
const templates = require("./templates");
const argon2 = require("argon2");
const uuid = require("uuid").v4;
const randomString = require("randomstring").generate;
const bodyParser = require("body-parser").urlencoded({ extended: false, limit: "8mb" });
const bodyParserRaw = require("body-parser").raw({ type: "application/json" });
const csrf = require("csurf")({ cookie: true });
const validateUrl = require("valid-url").isUri;
const reservedUsernames = require("./data/reservedUsernames.json");
const sharp = require("sharp");
const fs = require("fs");
const { createCanvas } = require("canvas");
const remark = require("remark");
const html = require("remark-html");
const gfm = require("remark-gfm");

// load .env
require("dotenv").config();
const { DOMAIN, WEB_ORIGIN, STRIPE_SECRET, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE } = process.env;

// format date
const formatDate = d => {
    const month = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
    ][d.getUTCMonth()];

    const day = d.getUTCDate();
    const extension = {
        1: "st",
        2: "nd",
        3: "rd",
        21: "st",
        22: "nd",
        23: "rd",
        31: "st"
    }[day] || "th";

    const year = d.getUTCFullYear();

    return `${month} ${day}${extension} ${year}`;
};

// render markdown
const markdown = (text) =>
    new Promise((resolve, reject) => {
        remark()
            .use(html, { sanitize: true })
            .use(gfm)
            .process(text, (err, file) => {
                if (err) return reject(err);
                resolve(String(file));
            });
    });

// validate email
const validateEmail = (email) => !!/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email);

// stripe checkout
const stripe = require("stripe")(STRIPE_SECRET);
const stripeCheckout = async (id, email) => {
    const session = await stripe.checkout.sessions.create({
        customer_email: email,
        metadata: {
            accountId: id,
        },
        line_items: [{
            price: STRIPE_PRICE,
            quantity: 1,
        }],
        mode: "payment",
        success_url: `${WEB_ORIGIN}/dashboard`,
        cancel_url: `${WEB_ORIGIN}/dashboard`,
    });

    return session.url;
};

// express server
const express = require("express");
const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(require("cookie-parser")());
app.listen(8000);

// static
app.use("/assets", express.static("assets"));

// subdomain
app.use(async (req, _res, next) => {
    const hostname = req.hostname.split(".");
    let subdomain = hostname.shift();
    const domain = hostname.join(".");
    if (domain !== DOMAIN) subdomain = null;

    const site = subdomain && (
        await db.account.findUnique({
            where: { username: subdomain }
        })
    );

    req.site = site && site.activated ? site : null;
    next();
});

// blog homepage
app.get("/", async (req, res, next) => {
    const { site } = req;
    if (!site) return next();

    // get posts
    const posts = await db.post.findMany({
        where: {
            accountId: site.id,
            publishedAt: {
                not: null
            },
            deletedAt: null
        },
        orderBy: {
            publishedAt: "desc"
        },
        take: 50,
    });

    // render page
    res.send(templates.siteHome({
        name: site.name,
        username: site.username,
        about: site.about,
        picture: site.picture && `${WEB_ORIGIN}/uploads/${site.id}/${site.picture}`,
        link: site.link,
        html: site.html,
        posts: posts.map(post => {
            let content = post.content ? post.content.substring(0, 512).trimEnd() : "";
            if (content.split("\n").length > 3) content = content.split("\n").slice(0, 3).join("\n").trimEnd();

            return {
                slug: post.slug,
                title: post.title,
                content,
                date: formatDate(post.publishedAt)
            };
        })
    }));
});

// blog feed
app.get("/feed.xml", async (req, res) => {
    const { site } = req;
    if (!site) return next();

    // get posts
    const posts = await db.post.findMany({
        where: {
            accountId: site.id,
            publishedAt: {
                not: null
            },
            deletedAt: null
        },
        orderBy: {
            publishedAt: "desc"
        },
        take: 50,
    });

    // render feed
    res.type("application/rss+xml").send(templates.feed({
        name: site.name,
        username: site.username,
        about: site.about,
        picture: site.picture && `${WEB_ORIGIN}/uploads/${site.id}/${site.picture}`,
        posts: posts.map(post => {
            let content = post.content ? post.content.substring(0, 512).trimEnd() : "";
            if (content.split("\n").length > 3) content = content.split("\n").slice(0, 3).join("\n").trimEnd();

            return {
                slug: post.slug,
                title: post.title,
                content,
                date: post.publishedAt.toUTCString()
            };
        })
    }));
});

// blog post
app.get("/:slug", async (req, res, next) => {
    const { site } = req;
    if (!site) return next();

    // get post
    const { slug } = req.params;
    const post = await db.post.findUnique({
        where: {
            accountId_slug: {
                accountId: site.id,
                slug,
            }
        }
    });
    if (!post || !post.publishedAt || post.deletedAt) return res.redirect("/");

    // add view
    await db.view.upsert({
        where: {
            postId_address: {
                postId: post.id,
                address: req.ip,
            }
        },
        create: {
            postId: post.id,
            address: req.ip,
        },
        update: {},
    })

    // render page
    res.send(templates.sitePost({
        slug: post.slug,
        title: post.title,
        date: formatDate(post.publishedAt),
        content: post.content && await markdown(post.content),
        site: {
            name: site.name,
            username: site.username,
            picture: site.picture && `${WEB_ORIGIN}/uploads/${site.id}/${site.picture}`,
            html: site.html,
        }
    }))
});

// blog post card
app.get("/:slug/card.png", async (req, res, next) => {
    const { site } = req;
    if (!site) return next();

    // get post
    const { slug } = req.params;
    const post = await db.post.findUnique({
        where: {
            accountId_slug: {
                accountId: site.id,
                slug,
            }
        }
    });
    if (!post || !post.publishedAt || post.deletedAt) return res.status(404).send();

    // create image
    const canvas = createCanvas(1200, 600);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#111827";
    ctx.fillRect(0, 0, 1200, 600);

    const gradient = ctx.createLinearGradient(0, 0, 1200, 0);
    gradient.addColorStop(0, "#C026D3");
    gradient.addColorStop(1, "#1E40AF");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 575, 1200, 25);

    ctx.fillStyle = "#9CA3AF";
    ctx.font = "bold 24px Inter";
    ctx.fillText(`${site.username}.${DOMAIN}/${post.slug}`, 125, 150);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 64px Inter";
    const words = (post.title || "Untitled Post").split(" ");
    const lines = [];
    let currentLine = words[0];
    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(`${currentLine} ${word}`).width;
        if (width < 950) {
            currentLine += ` ${word}`;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    lines.forEach((line, i) => ctx.fillText(line, 125, 225 + i * 75));

    // response
    res.type("image/png").send(canvas.toBuffer());
});

// redirect to main site
app.use((req, res, next) => {
    if (req.hostname === DOMAIN) next();
    else res.redirect(WEB_ORIGIN);
});

// uploads
app.use("/uploads", express.static("uploads"));

// auth
const auth = async (token) => {
    if (typeof token !== "string") return null;

    // get session
    const session = await db.session.findUnique({
        where: { token },
        include: {
            account: true,
        }
    });
    if (!session) return null;

    // update session
    await db.session.update({
        where: { id: session.id },
        data: { usedAt: new Date() },
    });

    return session.account;
};

// require auth
const requireAuth = async (req, res, next) => {
    const account = await auth(req.cookies.token);
    if (account) {
        req.account = account;
        next();
    } else res.redirect("/login");
};

// homepage
app.get("/", async (req, res) => {
    if (await auth(req.cookies.token)) res.redirect("/dashboard");
    else res.send(templates.home());
});

// logo
app.get("/logo.png", (_req, res) => {
    // create image
    const canvas = createCanvas(256, 256);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#111827";
    ctx.fillRect(0, 0, 256, 256);

    const gradient = ctx.createLinearGradient(0, 64, 0, 192);
    gradient.addColorStop(0, "#C026D3");
    gradient.addColorStop(1, "#1E40AF");
    ctx.fillStyle = gradient;
    ctx.font = "bold 128px Inter";
    ctx.fillText("W", 128 - ctx.measureText("W").width / 2, 176);

    // response
    res.type("image/png").send(canvas.toBuffer());
});

// taylor
app.get("/taylor", (_req, res) => res.redirect("https://www.youtube.com/watch?v=dQw4w9WgXcQ"));

// login page
app.get("/login", csrf, (req, res) => res.send(templates.login({
    username: req.query.username,
    error: typeof req.query.error === "string",
    csrf: req.csrfToken(),
})));

// login
app.post("/login", bodyParser, csrf, async (req, res) => {
    const { username, password } = req.body;
    if (typeof username !== "string" || typeof password !== "string") return res.status(400).send();
    const fail = () => res.redirect(`/login?username=${encodeURIComponent(username)}&error`);

    // get account
    const account = await db.account.findFirst({
        where: {
            OR: [{ username: username.toLowerCase() }, { email: username.toLowerCase() }]
        }
    });
    if (!account) return fail();

    // check password
    if (!await argon2.verify(account.password, password)) return fail();

    // create session
    const session = await db.session.create({
        data: {
            id: uuid(),
            token: randomString({ capitalization: "lowercase", length: 32 }),
            address: req.ip,
            accountId: account.id,
        }
    });

    // set cookie
    res.cookie("token", session.token, {
        maxAge: 90 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    });

    // redirect
    res.redirect("/dashboard");
});

// register page
app.get("/register", csrf, (req, res) => res.send(templates.register({
    name: req.query.name,
    username: req.query.username,
    email: req.query.email,
    error: req.query.error,
    csrf: req.csrfToken(),
})));

// register
app.post("/register", bodyParser, csrf, async (req, res) => {
    let { name, username, email, password } = req.body;
    if (typeof name !== "string" || typeof username !== "string" || typeof email !== "string" || typeof password !== "string") return res.status(400).send();
    const fail = (error) => res.redirect(`/register?name=${encodeURIComponent(name)}&username=${encodeURIComponent(username)}&email=${encodeURIComponent(email)}&error=${error}`);

    name = name.trim();
    username = username.trim().toLowerCase();
    email = email.trim().toLowerCase();

    // check fields
    if (!name || !username || !email || !password) return fail("fields_empty");
    if (name.length > 32) return fail("name_max_length");
    if (username.length > 16) return fail("username_max_length");
    if (username.length < 3) return fail("username_min_length");
    if (email.length > 64) return fail("email_max_length");
    if (!/^[0-9a-z]+$/.test(username)) return fail("username_chars");
    if (!validateEmail(email)) return fail("email_chars");

    // prevent multiple accounts
    const sessions = await db.session.count({
        where: {
            address: req.ip,
            usedAt: {
                gt: new Date(new Date().getTime() - 24 * 60 * 60 * 1000)
            }
        }
    });
    if (sessions) return fail("generic");

    // reserved usernames
    if (reservedUsernames.includes(username)) return fail("username_taken");

    // create account if username is unique
    const id = uuid();
    const account = await db.account.upsert({
        where: { username },
        create: {
            id,
            username,
            password: await argon2.hash(password),
            name,
            email,
            activated: false,
        },
        update: {}
    });

    // check account was created (username not taken)
    if (account.id !== id) return fail("username_taken");

    // create session
    const session = await db.session.create({
        data: {
            id: uuid(),
            token: randomString({ capitalization: "lowercase", length: 32 }),
            address: req.ip,
            accountId: account.id,
        }
    });

    // set cookie
    res.cookie("token", session.token, {
        maxAge: 90 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    });

    // redirect
    res.redirect("/dashboard");
});

// activate
app.get("/activate", requireAuth, (req, res) => {
    const { account } = req;
    if (account.activated) res.redirect("/dashboard");
    else stripeCheckout(account.id, account.email)
        .then(url => res.redirect(url))
        .catch(() => res.redirect("/dashboard"));
});

// activation webhook for stripe
app.post("/activate", bodyParserRaw, async (req, res) => {
    try {
        const event = stripe.webhooks.constructEvent(req.body, req.headers["stripe-signature"], STRIPE_WEBHOOK_SECRET);
        const session = await stripe.checkout.sessions.retrieve(
            event.data.object.id,
            { expand: ["line_items"] }
        );

        if (session.line_items.data[0].price.id === STRIPE_PRICE)
            await db.account.update({
                where: {
                    id: session.metadata.accountId
                },
                data: {
                    activated: true
                }
            });

        res.status(200).send();
    } catch (err) {
        return res.status(400).send();
    }
});

// dashboard
app.get("/dashboard", requireAuth, csrf, async (req, res) => {
    const { account } = req;

    // get posts
    const posts = await db.post.findMany({
        where: {
            accountId: account.id,
            deletedAt: null
        },
        orderBy: {
            createdAt: "desc"
        },
        take: 100,
    });

    // generate tip
    const tip = !account.picture ?
        "First of all, upload a profile picture by hitting that + button!" :
        !account.about ?
            "Write a little something about yourself in the \"about\" section - use the \"Edit Profile\" button" :
            !account.link ?
                "Help people find you elsewhere on the internet by adding a link to your youtube/twitter/discord/whatever profile (use the \"Edit Profile\" button)" :
                !posts.length ?
                    "What's a blog without some posts? Hit \"New Post\" and start writing. Can't think of anything? How about a short post introducing yourself!" :
                    null;

    // render page
    res.send(templates.dashboard({
        name: account.name,
        username: account.username,
        email: account.email,
        about: account.about,
        picture: account.picture && `${WEB_ORIGIN}/uploads/${account.id}/${account.picture}`,
        link: account.link,
        posts: posts.map(post => ({
            slug: post.slug,
            title: post.title,
            date: formatDate(post.createdAt),
            draft: !post.publishedAt
        })),
        tip,
        activated: account.activated,
        csrf: req.csrfToken()
    }));
});

// edit profile page
app.get("/profile", requireAuth, csrf, (req, res) => res.send(templates.profile({
    name: req.account.name,
    about: req.account.about,
    link: req.account.link,
    csrf: req.csrfToken(),
})));

// edit profile
app.post("/profile", requireAuth, bodyParser, csrf, async (req, res) => {
    let { name, about, link } = req.body;
    if (typeof name !== "string" || typeof about !== "string" || typeof link !== "string") return res.status(400).send();

    name = name.substring(0, 32).trim();
    about = about.substring(0, 512).trim();
    link = link.substring(0, 128).trim();
    if (link.split("://").length > 1) link = link.split("://")[1];

    // update account
    await db.account.update({
        where: { id: req.account.id },
        data: {
            name: name || undefined,
            about: about || null,
            link: link && link.includes(".") && validateUrl(`https://${link}`) ? link : null
        }
    });

    // redirect
    res.redirect("/dashboard");
});

// change email page
app.get("/email", requireAuth, csrf, (req, res) => res.send(templates.email({
    email: req.account.email,
    csrf: req.csrfToken(),
})));

// change email
app.post("/email", requireAuth, bodyParser, csrf, async (req, res) => {
    let { email } = req.body;
    if (typeof email !== "string") return res.status(400).send();

    email = email.substring(0, 64).trim().toLowerCase();

    // update account
    db.account.update({
        where: { id: req.account.id },
        data: {
            email: email && validateEmail(email) ? email : undefined,
        }
    })
        .then(() => res.redirect("/dashboard"))
        // could fail since email must be unique
        .catch(() => res.redirect("/email"));
});

// change password page
app.get("/password", requireAuth, csrf, (req, res) => res.send(templates.password({
    error: req.query.error,
    csrf: req.csrfToken()
})));

// change password
app.post("/password", requireAuth, bodyParser, csrf, async (req, res) => {
    const { account } = req;
    const { old, password, password2 } = req.body;
    if (typeof old !== "string" || typeof password !== "string" || typeof password2 !== "string") return res.status(400).send();

    // empty fields
    if (!old.trim() || !password.trim() || !password2.trim()) return res.redirect("/password");

    // check new passwords match
    if (password !== password2) return res.redirect("/password?error=match");

    // check old password
    if (!await argon2.verify(account.password, old)) return res.redirect("/password?error=old");

    // update account
    await db.account.update({
        where: { id: account.id },
        data: {
            password: await argon2.hash(password),
        }
    });

    // redirect
    res.redirect("/dashboard");
});

// set html page
app.get("/html", requireAuth, csrf, (req, res) => res.send(templates.customHtml({
    html: req.account.html,
    csrf: req.csrfToken()
})));

// set html
app.post("/html", requireAuth, bodyParser, csrf, async (req, res) => {
    let { html } = req.body;
    if (typeof html !== "string") return res.status(400).send();

    html = html.substring(0, 1024).trim();

    // update account
    await db.account.update({
        where: { id: req.account.id },
        data: {
            html: html || null,
        }
    });

    // redirect
    res.redirect("/dashboard");
});

// logout page
app.get("/logout", requireAuth, csrf, (req, res) => res.send(templates.logout({ csrf: req.csrfToken() })));

// logout
app.post("/logout", requireAuth, bodyParser, csrf, (_req, res) => {
    res.clearCookie("token");
    res.redirect("/");
});

// new post page
app.get("/new", requireAuth, csrf, (req, res) => res.send(templates.newPost({
    username: req.account.username,
    error: req.query.error,
    csrf: req.csrfToken()
})));

// new post
app.post("/new", requireAuth, bodyParser, csrf, async (req, res) => {
    let { slug } = req.body;
    if (typeof slug !== "string") return res.status(400).send();

    slug = slug.trim().toLowerCase().replace(/\-+/g, "-");
    if (!slug) return res.redirect("/new");
    if (slug.length > 32) return res.redirect("/new?error=length");
    if (!/^[0-9a-z\-]+$/.test(slug)) return res.redirect("/new?error=chars");


    // create post if slug is unique
    const id = uuid();
    const post = await db.post.upsert({
        where: {
            accountId_slug: {
                accountId: req.account.id,
                slug,
            }
        },
        create: {
            id,
            slug,
            accountId: req.account.id,
        },
        update: {}
    });

    // redirect to edit if successful
    // error if not unique
    if (post.id === id) res.redirect(`/post/${slug}/edit`);
    else res.redirect("/new?error=unique");
});

// view post
app.get("/post/:slug", requireAuth, csrf, async (req, res) => {
    const { account } = req;

    // get post
    const post = await db.post.findUnique({
        where: {
            accountId_slug: {
                accountId: account.id,
                slug: req.params.slug,
            }
        }
    });
    if (!post || post.deletedAt) return res.redirect("/dashboard");

    // count views
    let views;
    if (post.publishedAt) views = await db.view.count({ where: { postId: post.id } });

    // render page
    res.send(templates.viewPost({
        slug: post.slug,
        username: account.username,
        title: post.title,
        content: post.content && await markdown(post.content),
        draft: !post.publishedAt,
        views,
        csrf: req.csrfToken(),
    }));
});

// publish post
app.post("/post/:slug/publish", requireAuth, bodyParser, csrf, async (req, res) => {
    const { account } = req;

    // get post
    const post = await db.post.findUnique({
        where: {
            accountId_slug: {
                accountId: account.id,
                slug: req.params.slug,
            }
        }
    });
    if (!post || post.deletedAt) return res.redirect("/dashboard");
    if (post.publishedAt) return res.redirect(`/post/${post.slug}`);

    // update post
    await db.post.update({
        where: { id: post.id },
        data: {
            publishedAt: new Date()
        }
    });

    // redirect
    res.redirect(`/post/${post.slug}`);
});

// delete post page
app.get("/post/:slug/delete", requireAuth, csrf, async (req, res) => {
    const { account } = req;

    // get post
    const post = await db.post.findUnique({
        where: {
            accountId_slug: {
                accountId: account.id,
                slug: req.params.slug,
            }
        }
    });
    if (!post || post.deletedAt) return res.redirect("/dashboard");

    // render page
    res.send(templates.deletePost({
        slug: post.slug,
        csrf: req.csrfToken(),
    }));
});

// delete post
app.post("/post/:slug/delete", requireAuth, bodyParser, csrf, async (req, res) => {
    const { account } = req;

    // get post
    const post = await db.post.findUnique({
        where: {
            accountId_slug: {
                accountId: account.id,
                slug: req.params.slug,
            }
        }
    });
    if (!post || post.deletedAt) return res.redirect("/dashboard");

    // update post
    await db.post.update({
        where: { id: post.id },
        data: {
            deletedAt: new Date()
        }
    });

    // redirect
    res.redirect("/dashboard");
});

// edit post page
app.get("/post/:slug/edit", requireAuth, csrf, async (req, res) => {
    const { account } = req;

    // get post
    const post = await db.post.findUnique({
        where: {
            accountId_slug: {
                accountId: account.id,
                slug: req.params.slug,
            }
        }
    });
    if (!post || post.deletedAt) return res.redirect("/dashboard");

    // render page
    res.send(templates.editPost({
        slug: post.slug,
        title: post.title,
        content: post.content,
        csrf: req.csrfToken(),
    }));
});

// edit post
app.post("/post/:slug/edit", requireAuth, bodyParser, csrf, async (req, res) => {
    const { account } = req;
    let { title, content } = req.body;
    if (typeof title !== "string" || typeof content !== "string") return res.status(400).send();

    title = title.substring(0, 64).trim();
    content = content.trim();

    // get post
    const post = await db.post.findUnique({
        where: {
            accountId_slug: {
                accountId: account.id,
                slug: req.params.slug,
            }
        }
    });
    if (!post || post.deletedAt) return res.redirect("/dashboard");

    // update post
    await db.post.update({
        where: { id: post.id },
        data: {
            title: title || null,
            content: content || null
        }
    });

    // redirect
    res.redirect(`/post/${post.slug}`);
});

// upload picture
app.post("/picture", requireAuth, bodyParser, csrf, async (req, res) => {
    const { account } = req;
    const { picture } = req.body;
    if (typeof picture !== "string") return res.status(400).send();

    // process image
    const id = uuid();
    try {
        const img = await sharp(Buffer.from(picture.split("base64,")[1], "base64"))
            .resize(128, 128)
            .flatten({
                background: {
                    r: 255,
                    g: 255,
                    b: 255,
                },
            })
            .webp()
            .toBuffer();

        fs.mkdirSync(`uploads/${account.id}`, { recursive: true });
        fs.writeFileSync(`uploads/${account.id}/${id}.webp`, img);
    } catch (err) {
        return res.status(500).send();
    }

    // update account
    await db.account.update({
        where: { id: account.id },
        data: { picture: `${id}.webp` }
    });

    // redirect
    res.redirect("/dashboard");
});