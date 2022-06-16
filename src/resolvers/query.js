module.exports = {
    user: async (parent, {username}, {models}) => {
        return await models.User.findOne({username});
    },
    users: async (parent, args, {models}) => {
        return await models.User.find({});
    },
    me: async (parent, args, {models, user}) => {
        return models.User.findById(user.id);
    },
    notes: async (parent, args, {models}) => {
        return models.Note.find().limit(100);
    },
    note: async (parent, args, {models}) => {
        console.log(parent);
        return models.Note.findById(args.id);
    },
    noteFeed: async (parent, {cursor}, {models}) => {
        // Жестко кодируем лимит в 10 элементов
        const limit = 10;
        // Устанавливаем значение false по умолчанию для hasNextPage
        let hasNextPage = false;
        // Если курсор передан не будет, то по умолчанию запрос будет пуст
        // В таком случае из БД будут извлечены последние заметки
        let cursorQuery = {};
        // Если курсор задан, запрос будет искать заметки со значением ObjectId
        // меньше этого курсора
        if (cursor) {
            cursorQuery = {_id: {$lt: cursor}};
        }
        // Находим в БД limit + 1 заметок, сортируя их от старых к новым
        let notes = await models.Note.find(cursorQuery)
            .sort({_id: -1})
            .limit(limit + 1);
        // Если число найденных заметок превышает limit, устанавливаем
        // hasNextPage как true и обрезаем заметки до лимита
        if (notes.length > limit) {
            hasNextPage = true;
            notes = notes.slice(0, -1);
        }
        // Новым курсором будет ID Mongo-объекта последнего элемента массива списка
        const newCursor = notes[notes.length - 1]._id;
        return {
            notes,
            cursor: newCursor,
            hasNextPage
        };
    }
}