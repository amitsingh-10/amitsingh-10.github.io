class AvroGenerator {
    constructor(collectionName, databaseName) {
        this.collectionName = collectionName;
        this.databaseName = databaseName;
    }
}

class BasicElement {
    constructor(type, default_value) {
        this.type = createUnionWithNull(type);
        this.default = default_value;
    }

    addType(elementType) {
        this.type.push(elementType);
    }

    create(name, parent_namespace, parent_class) {
        this.name = name;
        this.namespace = parent_namespace + '.' + this.name;
        this.parent_class = parent_class;
    }

    parse(element) {
        this.name = element.name;
        this.parent_class = element.parent_class.name;
        this.namespace = element.parent_class.namespace + '.' + this.name;
    }

    toJSON() {
        return {
            name : this.name,
            default : this.default,
            type : this.type
        }
    }
}

class ArrayElement extends BasicElement {
    constructor() {
        var type = new InternalArrayElement(); // TODO : Write class definition
        super(type, null);
    }
}

class MapElement extends BasicElement {
    constructor() {
        var type = new InternalMapElement(); // TODO : Write class definition
        super(type, null);
    }
}

class RecordElement {
    constructor(name, namespace) {
        this.name = name;
        this.type = "record";
        this.namespace = namespace + '.' + this.name;
        this.fields = []
    }

    addField(elem) {
        this.fields.push(elem);
    }
}

class BooleanElement extends BasicElement {
    constructor() {
        super("boolean", false);
    }
}

class StringElement extends BasicElement {
    constructor(default_value="null") {
        super("string", default_value);
    }
}

class IntegerElement extends BasicElement {
    constructor() {
        super("long",0);
    }
}

class DoubleElement extends BasicElement {
    constructor() {
        super("double",0);
    }
}

class LongElement extends BasicElement {
    constructor() {
        super("null", null);
    }

    create(name, parent_namespace, parent_class) {
        super.create(name, parent_namespace, parent_class);

        var field = new StringElement("0");
        field.create("numberLong",parent_namespace, parent_class);

        var type = new RecordElement(name, this.namespace);
        type.addField(field);
        this.addType(type);
    }
}

class DateElement extends BasicElement {
    constructor() {
        var type = new RecordElement(name, namespace);
        type.addField((new StringElement("0")).create("date",namespace,name));
        super("null", null);
    }

    create(name, parent_namespace, parent_class) {
        super.create(name, parent_namespace, parent_class);

        var field = new StringElement("0");
        field.create("date",parent_namespace, parent_class);

        var type = new RecordElement(name, this.namespace);
        type.addField(field);
        this.addType(type);
    }
}

class ObjectId extends BasicElement {
    constructor() {
        this.type = new RecordElement(); // TODO : Replace definition here
        this.default = null;
    }
}

function createUnionWithNull(values) {
    if ( values.constructor == Array )
        if ( !values.includes("null") )
            values = [...values, "null"];
    else if (values != "null")
            values = [values, "null"];
    else
        values = [values];
    return values;
}