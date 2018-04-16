function processFileListData(root, data, sortArray, sortRule, sortIndex, reverseIndex, that, cb) {
    /* Handler local/cloud file list process data function.
     * create date: 2017/11/22
     * update date: 2017/11/28
     * version: 1
     * property:
     *  ---------------------------------------------------------------
     *    name          / typeof   / description                 / must
     *  ---------------------------------------------------------------
     *  @ root          / string   / api root                     /  V
     *  @ data          / number   / api response data            /  V
     *  @ sortArray     / number   / from that.sortArray          /  V
     *  @ sortRule      / string   / from that.sortRule           /  V
     *  @ sortIndex     / boolean  / from that.state.sortIndex    /  V
     *  @ reverseIndex  / object   / from that.state.reverseIndex /  V
     *  @ that          / object   / from invoke component.       /  V
     *  @ cb            / function / callback function.           /  X
     *  ---------------------------------------------------------------
     * TODO: local user_created.jsx
     * TODO: cloud user_created.jsx
     * TODO: translateData.jsx
     * DONE: paylist/addFile
     * 
     * */

    let self = this,
        getData,
        fileList = [],
        fileType,
        extensionName,
        size,
        time,
        catalogList = [],
        catalog = {},
        photo = [],
        music = [],
        video = [],
        pdf = [],
        txt = [],
        folderGroup = [],
        fileGroup = [],
        itemKey = sortArray[sortIndex],
        parseKey = sortRule[itemKey].parseKey,
        mainSort = reverseIndex === 0 ? ["asc"] : ["desc"],
        reverse = mainSort.concat(sortRule[itemKey].subSort),
        taskSourceTitle = root === "local"
            ? "/Local Folders"
            : "/Cloud Folders";

    getData = data.items === undefined ? [] : data.items;
    getData.map(item => {
        if (item.name.startsWith(".")) {
            return;
        }
        if (item.isProcessData) {
            return;
        }
        size = Common.toSize(item.size);
        time = Common.toDate(item.access_date);
        if (item.type === "folder") {
            if (item.name.startsWith(".")) {
                return;
            }
            folderGroup.push({
                title: item.name,
                name: item.name,
                icon: "folder-full",
                key: item.name,
                isFolder: true,
                subTitle: "",
                class: "folder",
                fileType: "folder",
                size: size,
                time: time,
                type: "action",
                isProcessData: true,
                path: item.path,
                taskSourceTitle: taskSourceTitle,
                apiType: item.type
            });
        } else {
            extensionName = Common.getExtensionName(item.name);
            if (typeof extensionName === "string") {
                extensionName = extensionName.toLowerCase();
            }
            fileType = Common.getFileType(extensionName);
            switch (fileType) {
                case "music":
                    item.icon = "music";
                    music.push(item);
                    break;
                case "photo":
                    item.leftAvatar = Common.getPlayerSrcPath(
                        "life/v1/file?query=" +
                            encodeURIComponent(
                                JSON.stringify({
                                    root: "cloud",
                                    path: item.path,
                                    type: "t"
                                })
                            )
                    );
                    item.type = "photo";
                    item.icon = "";
                    photo.push(item);
                    break;
                case "video":
                    item.icon = "theater";
                    video.push(item);
                    break;
                case "pdf":
                    item.icon = "pdf";
                    pdf.push(item);
                    break;
                case "txt":
                    item.icon = "file";
                    txt.push(item);
                    break;
                default:
                    item.icon = "file";
            }
            fileGroup.push({
                title: item.name,
                name: item.name,
                icon: item.icon,
                key: item.name,
                isFolder: false,
                subTitle: "",
                class: "file",
                fileType: fileType,
                size: size,
                byte: item.size,
                time: time,
                img: item.leftAvatar ? item.leftAvatar : "",
                type: "action",
                isProcessData: true,
                path: item.path,
                extensionName: extensionName,
                taskSourceTitle: taskSourceTitle,
                apiType: item.type
            });
        }
    });

    catalog = {
        music: music,
        photo: photo,
        video: video,
        pdf: pdf,
        txt: txt
    };

    if (that.state.isServerSort) {
        catalogList.push(catalog);
        folderGroup = folderGroup;
        fileGroup = fileGroup;
        fileList = folderGroup.concat(fileGroup);
    } else {
        let isInfinite = that.state.isInfinite && getData.length > 0,
            validCatalogList = that.state.hasOwnProperty("catalogList")
                ? that.state.catalogList.length > 0
                : false,
            _catalogList = {};

        if (validCatalogList) {
            for (let index in appConst.FILE_CLASSIFICATION) {
                let key = appConst.FILE_CLASSIFICATION[index];
                _catalogList[key] = Common.sortByKey2(
                    isInfinite,
                    validCatalogList ? that.state.catalogList[0][key] : [],
                    catalog[key],
                    parseKey,
                    reverse
                );
            }
            catalogList.push(_catalogList);
        }

        folderGroup = Common.sortByKey2(
            isInfinite,
            that.state.folderGroup ? that.state.folderGroup : [],
            folderGroup,
            parseKey,
            reverse
        );

        fileGroup = Common.sortByKey2(
            isInfinite,
            that.state.fileGroup ? that.state.fileGroup : [],
            fileGroup,
            parseKey,
            reverse
        );

        fileList = folderGroup.concat(fileGroup);
    }

    if (cb) {
        cb(fileList);
    } else {
        that.setState(
            {
                isInited: true,
                fileList: fileList,
                folderGroup: folderGroup,
                fileGroup: fileGroup,
                catalogList: catalogList,
                isInfiniteLoading: false,
                isInfinite: getData.length > 0 ? false : true,
                isServerSort:
                    fileList.length > appConst.FILE_LIST_LIMIT
            },
            () => {
                that.props.refreshState && that.props.refreshState(
                        { loadingState: true }
                    );
            }
        );
    }
}