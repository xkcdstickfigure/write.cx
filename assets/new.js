document.querySelector("input[name=slug]").oninput = (e) => {
    e.target.value = e.target.value.toLowerCase().replaceAll(" ", "-").replace(/[^0-9a-z\-]/g, "").replace(/\-+/g, "-");
};