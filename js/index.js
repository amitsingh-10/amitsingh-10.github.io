// ? Refactor code
// ? Add support for parent class
// ? Handle array and map for primitive type
// ? In case of record should only pass inner stuff not the one above with null and stuff
class Stack {
  constructor() {
    this.items = [];
  }

  push(element) {
    this.items.push(element);
  }

  pop() {
    if (this.isEmpty())
      return "Empty stack!";
    return this.items.pop();
  }

  isEmpty() {
    return this.items.length == 0;
  }

  peek() {
    if (this.isEmpty())
      return this.items[this.items.length - 1];
    else
      return "Empty stack!";
  }
}

function identify_type(element) {
  if (element["type"].constructor == Array) {
    child_element = element["type"][1];
    if (child_element["type"] == "array") 
      return "array";
    else if (child_element["type"] == "map") 
      return "map";
    else if (child_element["type"] == "record") {
      return (child_element["fields"][0]["name"] == 'date') ? "date" : "int64";
    }
    else {
      element.forEach(function(e) {
        if ( e["type"] != "null" )
          return e["type"];
      });
    }
  }
  else if (element["type"].constructor == Object)
    return "uuid";
  else
    return element["type"];
}

// ? REFACTOR CODE TO TAKE CLASS PARAMETER
function parse(arr, namespace) {
  // Suppose we have got fields, items, values. What to do now?
  arr.forEach(function(element) {
    type = identify_type(element);
    if ( type == 'record' ) {
      console.log(element);
    }
    else if ( type == 'array' ) {
      console.log(element);
    }
    else if ( type == 'map' ) {
      console.log(element);
    }
    else {
      console.log(element);
    }
    addElementToAvro(namespace, parsed_class);
  })
}

$(document).ready(function () {
  const createUUIDElement = (name, namespace) => ({
    name: name,
    type: {
      type: "record",
      name: name,
      namespace : namespace + '.' + name,
      fields: [
        {
          name: "oid",
          type: ["string", "null"]
        }
      ]
    }
  });

  const createBooleanElement = name => ({
    name: name,
    type: ["boolean", "null"],
    default: false
  });

  const createStringElement = name => ({
    name: name,
    type: ["string", "null"],
    default: "null"
  });

  const createInt32Element = name => ({
    name: name,
    type: ["long", "null"],
    default: 0
  });

  const createFloatElement = name => ({
    name: name,
    type: ["double", "null"],
    default: 0
  });

  const createInt64Element = (name, namespace) => ({
    name: name,
    default: null,
    type: [
      "null",
      {
        name: name,
        type: "record",
        namespace: namespace + "." + name,
        fields: [
          {
            name: "numberLong",
            type: "string",
            default: "0"
          }
        ]
      }
    ]
  });

  const createDateElement = (name, namespace) => ({
    name: name,
    default: null,
    type: [
      "null",
      {
        type: "record",
        name: name,
        namespace: namespace + "." + name,
        fields: [
          {
            name: "date",
            type: "string",
            default: "0"
          }
        ]
      }
    ]
  });

  const createArrayElement = name => ({
    name: name,
    default: null,
    type: [
      "null",
      {
        name: name,
        type: "array",
        default: "null",
        items: ["null"]
      }
    ]
  });

  const createMapElement = name => ({
    name: name,
    default: null,
    type: [
      "null",
      {
        name: name,
        type: "map",
        values: ["null"]
      }
    ]
  });

  const createRecordElement = (name, namespace) => ({
    name: name,
    type: "record",
    class: name,
    namespace: namespace + "." + name,
    fields: []
  });

  function createElement(namespace) {
    var elem = "";

    if (queue.getLength() > 0) {
      var dequeued_item = queue.dequeue();

      type = dequeued_item["type"];
      element_name = dequeued_item["name"];

      // It is expected that Array and Map objects will always have a base type after them in queue
      // hence no special code to handle queue end.
      // Although we need to handle custom classes :)
      switch (type) {
        case "uuid":
          return createUUIDElement(element_name, namespace);
        case "boolean":
          return createBooleanElement(element_name);
        case "int32":
          return createInt32Element(element_name);
        case "int64":
          return createInt64Element(element_name, namespace);
        case "float":
          return createFloatElement(element_name);
        case "date":
          return createDateElement(element_name, namespace);
        case "string":
          return createStringElement(element_name);
        case "array":
          elem = createArrayElement(element_name);
          namespace += ".array." + element_name;
          child_elem = createElement(namespace);
          if ( "type" in child_elem ) {
            if (child_elem["type"].constructor == Array && child_elem["type"][0] != "null")
              child_elem = child_elem["type"][0];
            else if ( child_elem["type"].constructor == Object )
              child_elem = child_elem["type"];
          }
          elem["type"][1]["items"].push(child_elem);
          return elem;
        case "map":
          elem = createMapElement(element_name);
          namespace += ".map." + element_name;
          child_elem = createElement(namespace);
          if ( "type" in child_elem ) {
            if (child_elem["type"].constructor == Array && child_elem["type"][0] != "null")
              child_elem = child_elem["type"][0];
            else if ( child_elem["type"].constructor == Object )
              child_elem = child_elem["type"];
          }
          elem["type"][1]["items"].push(child_elem);
          return elem;
        case "record":
          var elem = createRecordElement(element_name, namespace);

          // Add element to all namespaces
          $(".namespace_selector").append(
            $("<option>")
              .attr({
                value: elem["namespace"],
                class: "namespace_option"
              })
              .text(elem["name"])
            // .text(elem["namespace"] + " -> " + elem["name"])
          );
          customClasses[elem["namespace"]] = {
            "class": elem["class"],
            "fields": elem["fields"]
          };
          return elem;
        default:
          // Should be a custom class then
          elem = createRecordElement(element_name, namespace);
          elem["class"] = customClasses[type]["class"];
          elem["fields"] = customClasses[type]["fields"];
          return elem;
      }
    }
  }

  function parse_namespace(namespace) {
    /*
     * We work under following consideration in the given function.
     * namespace is of format <DBName>.<CollectionName>.<namespace>
     */
    var path = namespace.split(".");
    var index = 2;

    var elem = avroJSON["fields"];
    var length = path.length;
    for (; index < length; ++index) {
      var i = 0;
      if (elem[i] == "null")++i;
      if (path[index] == "array") {
        index += 1;
        for (; i < elem.length; ++i) {
          if (elem[i]["name"] == path[index]) {
            elem = elem[i]["type"][1]["items"];
            break;
          }
        }
      } else if (path[index] == "map") {
        index += 1;
        for (; i < elem.length; ++i) {
          if (elem[i]["name"] == path[index]) {
            elem = elem[i]["type"][1]["values"];
            break;
          }
        }
      } else {
        for (; i < elem.length; ++i) {
          if (elem[i]["name"] == path[index]) {
            elem = elem[i]["fields"];
            break;
          }
        }
      }
    }

    return elem;
  }

  function restoreSelectors() {
    $(".duplicate_type_selector").remove();
  }

  function addElementToAvro(namespace) {
    var add_loc = {};
    if (namespace in customClasses) {
      // If class definition already exists
      add_loc = customClasses[namespace]["fields"];
    }
    else {
      // If it does not exists, we need to traverse it
      add_loc = parse_namespace(namespace);
    }

    // Check if name is unique
    var name = queue.peek()["name"];
    var length = add_loc.length;

    var i = 0;
    if (length != 0 && add_loc[0] == "null")++i;

    for (; i < length; ++i) {
      if (add_loc[i]["name"] == name) {
        alert(
          'Another element with name "' +
          name +
          '" exists in this namespace! Choose another name.'
        );
        while (queue.getLength() > 0) queue.dequeue();
        return;
      }
    }

    add_loc.push(createElement(namespace));

    // Restore all options' availability and select first of them
    $("select.type_selector option").prop("disabled", false);
    //$("#namespace").val($("#namespace option:first").val());
  }

  // Event listeners
  $("#reset").click(function () {
    restoreSelectors();

    while (queue.getLength() != 0) queue.dequeue();
  });

  $(".type_container").on("change", "select", function () {
    /*
     * Following cases need to be handled :
     * 1. Simple addition in case of Array, Map
     * 2. In case of any other type, add an input name box
     * 3. If any previous selectors are changed, all further selectors should be removed.
     */

    var id = event.srcElement.id;
    $("#" + id)
      .nextAll(".duplicate_type_selector")
      .remove();

    var value = $("#" + id).val();
    if (value == "array" || value == "map") {
      var elem = $("#main_selector").clone();
      elem.addClass("duplicate_type_selector");
      elem.prop(
        "id",
        "selector_" + Math.floor(Math.random() * Math.floor(1000))
      );
      $(".type_container").append(
        "<label class='duplicate_type_selector'> of type : </label>"
      );
      $(".type_container").append(elem);
    } else if ($("#" + id).hasClass("duplicate_type_selector")) {
      var elem = $("<input>").attr({
        id: "base_element_name",
        type: "text",
        class: "duplicate_type_selector",
        placeholder: "Enter name of Class/Element",
        required: "required"
      });
      $(".type_container").append(elem);
    }
  });

  $("#namespace").change(function () {
    var val = $(this).val();
    $("select.type_selector option").prop("disabled", false);
    $('select.type_selector option[value="default"]').prop("disabled", true);
    $('select.type_selector option[value="' + val + '"]').prop(
      "disabled",
      true
    );
    $(".type_container select.type_selector:last").val(
      $('.type_selector option[value="default"]').val()
    );
  });

  $("#avro_creator").submit(function (e) {
    e.preventDefault();

    var name = $("#element_name").val();
    var namespace = $("#namespace").val();
    var elem_type = $("#main_selector").val();
    queue.enqueue({ name: name, type: elem_type });

    var getExtraSelectors = $("select.duplicate_type_selector");
    var length = getExtraSelectors.length;
    if (length > 0) {
      i = 0;
      length -= 1;
      for (i = 0; i < length; ++i) {
        var value = getExtraSelectors[i].value;
        queue.enqueue({
          name: "_" + (i + 1),
          type: value,
          namespace: value
        });
      }
      queue.enqueue({
        name: $("#base_element_name").val(),
        type: getExtraSelectors[length].value
      });
    }
    addElementToAvro(namespace);

    $("#generated_avro").val(JSON.stringify(avroJSON, null, 4));
  });

  $("#resetAvro").click(function () {
    customClasses = {};

    collectionName = $('#collection_name').val();
    databaseName = $('#database_name').val();
    avroJSON = createRecordElement(collectionName, databaseName);
    $("#generated_avro").val(JSON.stringify(avroJSON, null, 4));
    $("#namespace").find('option:contains("Collection")').attr('value',avroJSON['namespace']);

    $(".namespace_option").remove();
  });

  $("#resetClass").click(function () {
    var val = $("#namespace").val();

    // We do not use customClasses[val] = [] since it creates a new array so changes would not
    // reflect in already created classes.
    // See https://stackoverflow.com/questions/1232040/how-do-i-empty-an-array-in-javascript.
    if (val in customClasses) {
      customClasses[val]['fields'].length = 0;
    }
    else { // Means it should be the main Record
      avroJSON.fields.length = 0;
    }
    $("#generated_avro").val(JSON.stringify(avroJSON, null, 4));
  });

  $('#inferAvro').click(function () {
    var json = JSON.parse($('#generated_avro').val());
    preSteps(json['name'], json['namespace'].split('.')[0]);
    restoreSelectors();
    $('#main_selector option.namespace_option').remove();

    // Parse JSON, fill avroJSON
  });

  function preSteps(collectionName, databaseName) {
    avroJSON = createRecordElement(collectionName, databaseName);
    $("#namespace").find('option').remove().end().append(new Option("Collection", avroJSON["namespace"]));
    $("main_selector").append(
      $("<option>")
        .attr({
          value: "",
          selected: true,
          disabled: true,
          hidden: true
        })
        .text("Choose type")
    );
    $("#generated_avro").val(JSON.stringify(avroJSON, null, 4));
  }
  // Setup the page

  /*
  ? How to get the following two variables
  */
  var collectionName = "Deal";
  var databaseName = "AutoDeal";

  var queue = new Queue();
  var customClasses = {};
  var avroJSON = {};
  preSteps(collectionName, databaseName);
});
