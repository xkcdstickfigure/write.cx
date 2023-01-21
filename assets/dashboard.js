document.querySelector("input[name=pictureFile]").onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = () => {
            document.querySelector("input[name=picture]").value = reader.result;
            e.target.parentElement.submit();
        };
        reader.readAsDataURL(file);
    }
};