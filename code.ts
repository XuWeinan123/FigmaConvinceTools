// This plugin creates 5 rectangles on the screen.
console.log(figma.command)
switch (figma.command) {
  case "phoneHorizontal":
    phoneHorizontal();
    break;
  case "phonePortrait":
    phonePortrait()
    break;
  case "documentSize":
    documentSize()
    break;
  case "phoneAuto":
    phoneAuto();
    break;
  case "perArtboardRename":
    perArtboardRename()
    break;
  case "showPanel":
    showPanel()
    break;
  default:
    break;
}
//用一个公共变量保存已经加载的字体
var loadedFonts = new Array()

function badCompany() {
  var selections = figma.currentPage.selection;
  var instanceSelections = []
  if (selections.length > 0) {
    var totalWidth = 0
    for (const selection of selections) {
      if (selection.type == "INSTANCE") {
        instanceSelections.push(selection)
        totalWidth = totalWidth + selection.width
      }
    }
    if (instanceSelections.length == 0) {
      figma.notify("请至少选择一个实例")
    } else {
      function sortNumber(a, b) {
        return a.x - b.x
      }
      instanceSelections.sort(sortNumber)
      //计算缩放因素
      var scaleFactor = (instanceSelections[0].parent.width * 0.8) / totalWidth
      var spacing = 0

      if (scaleFactor > 1) {
        scaleFactor = 1
      }
      if (instanceSelections.length > 1) {
        spacing = instanceSelections[0].parent.width * 0.1 / (instanceSelections.length - 1)
      }
      if (spacing < 100) {
        spacing = Math.floor(spacing)
      } else {
        spacing = 100
      }

      var realTotalWidth = 0
      for (var i = 0; i < instanceSelections.length; i++) {
        var realWidth = Math.floor(instanceSelections[i].width * scaleFactor)
        instanceSelections[i].scaleFactor = realWidth / instanceSelections[i].mainComponent.width
        realTotalWidth = realTotalWidth + realWidth
      }
      var spacingSumTotalWidth = realTotalWidth + spacing * (instanceSelections.length - 1)
      //总宽度，依据总宽度决定是否要适当增加spacing
      if (spacingSumTotalWidth < (instanceSelections[0].parent.width * 0.8) ||
        (realTotalWidth + 100 * (instanceSelections.length - 1)) < instanceSelections[0].parent.width) {
        spacing = 100
      }
      var orginX = (instanceSelections[0].parent.width - realTotalWidth - spacing * (instanceSelections.length - 1)) / 2
      instanceSelections[0].x = orginX
      instanceSelections[0].y = (instanceSelections[0].parent.height - instanceSelections[0].height) / 2
      for (var i = 1; i < instanceSelections.length; i++) {
        instanceSelections[i].x = instanceSelections[i - 1].x + instanceSelections[i - 1].width + spacing
        instanceSelections[i].y = (instanceSelections[i].parent.height - instanceSelections[i].height) / 2
      }
    }
  }
}
function sortInstance() {
  var scaleFactors = [1, 1, 1, 1, 1, 4 / 5, 7 / 10]
  var selections = figma.currentPage.selection;
  var instanceSelections = []
  if (selections.length > 0 && selections.length < 8) {
    for (const selection of selections) {
      if (selection.type == "INSTANCE") {
        instanceSelections.push(selection)
      }
    }
    if (instanceSelections.length == 0) {
      figma.notify("请至少选择一个实例")
    } else {
      function sortNumber(a, b) {
        return a.x - b.x
      }
      instanceSelections.sort(sortNumber)
      var number = instanceSelections.length
      for (const instanceSelection of instanceSelections) {
        instanceSelection.scaleFactor = scaleFactors[number - 1]
      }
      var parentWidth = instanceSelections[0].parent.width
      var parentHeight = instanceSelections[0].parent.height
      var childWidth = instanceSelections[0].width
      var childHeight = instanceSelections[0].height
      var spacing = 100 * scaleFactors[number - 1]
      for (var i = 0; i < instanceSelections.length; i++) {
        instanceSelections[i].x = parentWidth / 2 - childWidth / 2 * number - spacing / 2 * (number - 1) + ((childWidth + spacing) * i)
        instanceSelections[i].y = (parentHeight - childHeight) / 2
        //instanceSelections[i].strokes = [{ type: "SOLID", color: { b: 0, g: 0, r: 0 } }]
        //instanceSelections[i].strokeWeight = 1
        //instanceSelections[i].strokeAlign = "OUTSIDE"
      }
      figma.notify("Done");
    }
  } else if (selections.length == 0) {
    figma.notify("请至少选择一个图层")
  } else if (selections.length >= 8) {
    figma.notify("实例过多，无法整理。")
  }
}

async function addTitleToInstance() {
  var selections = figma.currentPage.selection;
  for (const selection of selections) {
    if (selection.type != "INSTANCE") {
      figma.notify("不要选择实例之外的图层")
      return;
    }
  }
  var instanceSelections = []
  const symbolPage = figma.currentPage;
  if (symbolPage.type === "PAGE") {
    const titleInstance = symbolPage.findChild(node => node.type === "INSTANCE" && node.name === "页面描述")
    const declareInstance = symbolPage.findChild(node => node.type === "INSTANCE" && node.name === "1文档/1-交互逻辑")
    if (titleInstance == null && declareInstance == null) {
      figma.notify("请把东西放到这个画板里")
      return
    }
    if (selections.length > 0) {
      for (const selection of selections) {
        if (selection.type == "INSTANCE") {
          instanceSelections.push(selection)
        }
      }
      if (instanceSelections.length == 0) {
        figma.notify("请至少选择一个实例")
      } else {
        if (titleInstance.type == "INSTANCE") {
          console.log(instanceSelections.length)
          for (const instanceSelection of instanceSelections) {
            //画板的编号
            var count = 0;
            for (const selection of instanceSelections) {
              if (instanceSelection.x >= selection.x) {
                count++;
              }
            }
            var tempInstance = titleInstance.clone()
            instanceSelection.parent.appendChild(tempInstance)
            tempInstance.x = instanceSelection.x
            tempInstance.y = instanceSelection.y - tempInstance.height
            var numberChild = tempInstance.findOne(node => node.name === "编号")
            var titleChild = tempInstance.findOne(node => node.name === "当前页面名称")

            await loadNodeFonts([numberChild, titleChild])
            if (numberChild.type == "TEXT") {
              numberChild.characters = count.toString()
            }
            if (titleChild.type == "TEXT") {
              titleChild.characters = instanceSelection.mainComponent.name
            }
          }
        }
        if (declareInstance.type == "INSTANCE") {
          var tempInstance = declareInstance.clone()
          instanceSelections[0].parent.appendChild(tempInstance)
          tempInstance.x = instanceSelections[0].x
          tempInstance.y = instanceSelections[0].y + instanceSelections[0].height + 50
          tempInstance.resize(instanceSelections[0].width * 2 + 100, tempInstance.height)
          var declareChild = tempInstance.findOne(node => node.name === "说明文案")

          await loadNodeFonts([declareChild])

          if (declareChild.type == "TEXT") {
            declareChild.characters = "交互、文案、逻辑说明类，使用此颜色。"
          }
        }
      }
    } else {
      figma.notify("请至少选择一个图层")
    }
  }
}

async function loadNodeFonts(textNodes) {
  //加载一下涉及到的字体
  var fontNames = new Array()
  for (const textNode of textNodes) {
    if (textNode.type == "TEXT") {
      var hasSame = 0;
      for (const fontName of fontNames) {
        if ((textNode.fontName.family == fontName.family) && (textNode.fontName.style == fontName.style)) {
          hasSame = 1
          break;
        }
      }
      if ((hasSame == 0) && (textNode.fontName.family != undefined)) {
        fontNames.push(textNode.fontName)
      }
    }
  }
  for (const fontName of fontNames) {
    console.log("尝试加载0")
    //判断是否字体已加载
    var isLoaded = false;
    for (const loadedFont of loadedFonts) {
      if ((fontName.family == loadedFont.family) && (fontName.style == loadedFont.style)) {
        isLoaded = true
      }
    }
    if (isLoaded == false) {
      loadedFonts.push(fontName);
      await figma.loadFontAsync(fontName)
    }
  }
}

function phonePortrait() {
  var selections = figma.currentPage.selection;
  for (const selection of selections) {
    if (selection.type == "RECTANGLE" || selection.type == "FRAME" || selection.type == "INSTANCE") {
      selection.resize(360, 800)
    }
  }
  figma.closePlugin();
}
function phoneHorizontal() {
  var selections = figma.currentPage.selection;
  for (const selection of selections) {
    if (selection.type == "RECTANGLE" || selection.type == "FRAME" || selection.type == "INSTANCE") {
      selection.resize(800, 360)
    }
  }
  figma.closePlugin();
}
function documentSize() {
  var selections = figma.currentPage.selection;
  for (const selection of selections) {
    if (selection.type == "RECTANGLE" || selection.type == "FRAME" || selection.type == "INSTANCE") {
      selection.resize(2400, 1800)
    }
  }
  figma.closePlugin();
}

function phoneAuto() {
  var selections = figma.currentPage.selection;
  for (const selection of selections) {
    if (selection.parent != figma.currentPage) {
      var parentWidth: number
      var parentHeight: number
      if (selection.parent.type == "FRAME" || selection.parent.type == "COMPONENT") {
        parentWidth = selection.parent.width
        parentHeight = selection.parent.height
      }
      var widthScale = selection.width / parentWidth
      var heighScale = selection.height / parentHeight
      var scaleFactorss = (widthScale > heighScale ? widthScale : heighScale)
      console.log(scaleFactorss)
      if (selection.type == "INSTANCE") {
        selection.scaleFactor = 1 / scaleFactorss * selection.scaleFactor
      } else if (selection.type == "GROUP" || selection.type == "RECTANGLE") {
        selection.resize(selection.width / scaleFactorss, selection.height / scaleFactorss)
      }
      if (heighScale > widthScale) {
        selection.x = parentWidth / 2 - selection.width / 2
        selection.y = 0
      } else {
        selection.x = 0
        selection.y = parentHeight / 2 - selection.height / 2
      }
    }
  }
  figma.closePlugin();
}
//画板前缀重命名
function perArtboardRename() {
  var selections = figma.currentPage.selection;
  var position = new Array()
  for (var i = 0; i < selections.length; i++) {
    position.push([selections[i].x, selections[i].y])
  }
  //找到最小的那个坐标
  var minX = position[0][0]
  var minY = position[0][1]
  var index;
  for (var j = 0; j < position.length; j++) {
    if (position[j][0] <= minX) {
      minX = position[j][0]
    }
    if (position[j][1] <= minY) {
      minY = position[j][1]
    }
  }

  //找到最小坐标的那个画板，导出前缀
  var prefix = "XUWEINAN";
  for (var j = 0; j < position.length; j++) {
    if (position[j][0] == minX && position[j][1] == minY) {
      console.log("找到最小坐标的那个画板，导出前缀 " + selections[j].name)
      prefix = selections[j].name;
      break;
    }
  }
  var prefixLength = prefix.length
  for (var i = 0; i < prefixLength; i++) {
    var pattern3 = new RegExp("[0-9]+");
    if (pattern3.test(prefix.charAt(i))) {
      prefix = prefix.substring(0, i)
    }
  }
  //导出最终名称
  for (var i = 0; i < selections.length; i++) {
    var sequence = ((position[i][1] - minY) / 5100 + 1) + "." + ((position[i][0] - minX) / 1180 + 1)
    //对名称进行处理
    var tempName = selections[i].name
    var index2 = tempName.indexOf(" ");
    //log("index "+index2)
    tempName = tempName.substring(index2);
    //log(prefix+sequence+(index2 == -1 ? " ":"")+tempName)
    selections[i].name = prefix + sequence + (index2 == -1 ? " " : "") + tempName
  }
  figma.closePlugin();
}

function showPanel() {
  figma.showUI(__html__)
  figma.ui.resize(400, 360)
  //console.log("got")
  figma.ui.onmessage = async (message) => {
    //console.log("点按了面板上的方法 ", message)
    switch (message) {
      case "renameEverything":
        renameEverything()
        break;
      case "exchangePosition":
        exchangePosition()
        break;
      case "framesToComponents":
        framesToComponents()
        break;
      case "exportSelectedFramesToPDF":
        exportSelectedFramesToPDF()
        break;
      case "tracingSource":
        tracingSource()
        break;
        case "tracingChild":
            tracingChild();
            break;
      case "getFat":
        getFat()
        break;
      case "stoneFree":
        stoneFree();
        break;
      case "loveTrain":
        loveTrain()
        break;
      case "crazyDiamond":
        crazyDiamond()
        break;
      case "badCompany":
        badCompany()
        break;
      case "sortInstance":
        sortInstance()
        break;
      case "cloneAndReplace":
        cloneAndReplace()
        break;
        case "addTitleToInstance":
          addTitleToInstance()
          break;
      case "superCloneAndReplace":
        superCloneAndReplace()
        break;
        case "forceQueue":
          forceQueue()
          break;
      case "moveDown":
        moveDown()
        break;
      default:
        break;
    }

    //figma.closePlugin();
  }
}
function forceQueue() {
  var selections = figma.currentPage.selection
  var componentSelections = []
  var mainFrame
  for (const selection of selections) {
    if (selection.type == "FRAME") {
      mainFrame = selection
    } else {
      componentSelections.push(selection)
    }
  }
  var sumWidth = 0;
  for (var i = 0; i < componentSelections.length; i++) {
    componentSelections[i].x = mainFrame.x + mainFrame.width + 100 + sumWidth + i * 50
    componentSelections[i].y = mainFrame.y
    sumWidth = sumWidth + componentSelections[i].width
  }
}
function getFat() {
  var selections = figma.currentPage.selection
  for (const selection of selections) {
    if (selection.type == "RECTANGLE" || selection.type == "INSTANCE" || selection.type == "VECTOR" || selection.type == "ELLIPSE" || selection.type == "POLYGON") {
      if (selection.parent.type == "FRAME" || selection.parent.type == "COMPONENT") {
        selection.x = 0
        selection.y = 0
        selection.resize(selection.parent.width, selection.parent.height)
      } else if (selection.parent.type == "GROUP") {
        selection.x = selection.parent.x
        selection.y = selection.parent.y
        selection.resize(selection.parent.width, selection.parent.height)
      } else {
        figma.notify("爸爸不允许你膨胀")
      }
    } else {
      figma.notify("暂不支持此类型图层膨胀")
    }
  }
}
function tracingChild(){
  var selections = figma.currentPage.selection
  var newSelections = []
  for (const selection of selections) {
    if (selection.type == "COMPONENT"){
      var instances = figma.currentPage.findAll(n=>n.type=="INSTANCE" && n.mainComponent == selection)
      for(const instance of instances){
        newSelections.push(instance)
      }
    }
  }
  if (newSelections.length == 0) {
    figma.notify("查找失败")
  }
  figma.currentPage.selection = newSelections
}
function tracingSource() {
  var selections = figma.currentPage.selection
  var newSelections = new Array()
  for (const selection of selections) {
    if (selection.type == "INSTANCE"){
      if(selection.mainComponent.parent == figma.currentPage){
        newSelections.push(selection.mainComponent)
      }
    }
  }
  if (newSelections.length == 0) {
    figma.notify("你没有选择实例，无法找到对应的组件")
  }
  figma.currentPage.selection = newSelections
}
function crazyDiamond() {
  var selections = figma.currentPage.selection
  var offset = 0
  for (var i = 0; i < selections.length; i++) {
    var selection = selections[i]
    if (selection.type != "FRAME") {
      var frame = figma.createFrame()
      frame.resize(selection.width, selection.height)
      frame.x = selection.x
      frame.y = selection.y
      selection.parent.appendChild(frame)
      frame.appendChild(selection)
      selection.x = 0
      selection.y = 0
      frame.name = selection.name
      selection = frame
    }
    if (selection.type == "FRAME") {
      var children = selection.children
      var newComponent = figma.createComponent()
      for (const child of children) {
        newComponent.appendChild(child.clone())
      }
      newComponent.resize(selection.width, selection.height)
      newComponent.name = selection.name
      newComponent.fills = selection.fills
      var selectionParent = selection.parent
      while (selectionParent.parent != figma.currentPage) {
        selectionParent = selectionParent.parent
      }
      if (selectionParent.type == "FRAME") {
        newComponent.x = selectionParent.x + selectionParent.width + 100 + 50 * i + offset
        newComponent.y = selectionParent.y
        selectionParent.parent.appendChild(newComponent)
      }
      var newInstance = newComponent.createInstance()
      newInstance.x = selection.x
      newInstance.y = selection.y
      selection.parent.appendChild(newInstance)
      selection.remove()
      offset = offset + newComponent.width
    }
  }
}
function moveDown() {
  var selections = figma.currentPage.selection;
  for (const selection of selections) {
    selection.y += 1900
  }
}
function loveTrain() {
  var selections = figma.currentPage.selection
  if (selections.length != 1 || selections[0].type != "FRAME") {
    alert("只能选中一个画板")
  } else {
    var selection = selections[0]
    var otherFrames = figma.currentPage.findChildren(n => (n.x >= selection.x - 10 && n.x <= selection.x + 10) && n.y >= selection.y)
    figma.currentPage.selection = otherFrames
  }
  //figma.viewport.scrollAndZoomIntoView(newSelections)
  // function sortByX(a, b) {
  //   return a.x - b.x
  // }
  // newSelections.sort(sortByX)
  // if (newSelections.length != 0 && newSelections[0].parent.type == "FRAME") {
  //   var parentX = newSelections[0].parent.x
  //   var parentY = newSelections[0].parent.y
  //   var parentWidth = newSelections[0].parent.width

  //   var currentXOffset = 500
  //   for (const selection of newSelections) {
  //     if (selection.type == "INSTANCE") {
  //       selection.mainComponent.x = currentXOffset + parentWidth + parentX
  //       selection.mainComponent.y = parentY
  //       currentXOffset = currentXOffset + selection.mainComponent.width + 100
  //     }
  //   }
  // } else {
  //   figma.notify("不符合要求")
  // }
}
function stoneFree() {
  //尝试创建一条线
  function createVectorByPoints(points) {
    if (points.length < 2) {
      figma.notify("你输入的不是一根线");
    }
    var vector = figma.createVector();
    var newVertices = []
    for (var j = 0; j < points.length; j++) {
      var point = points[j]
      if (j == (points.length - 1)) {
        newVertices.push({
          x: point[0],
          y: point[1],
          strokeCap: "ARROW_LINES"
        })
      } else {
        newVertices.push({
          x: point[0],
          y: point[1],
          strokeCap: "ROUND"
        })
      }
    }

    var newSegments = []
    for (var i = 0; i < points.length - 1; i++) {
      newSegments.push({
        start: i,
        end: i + 1
      })
    }
    vector.vectorNetwork = {
      vertices: newVertices,
      segments: newSegments
    }
    vector.strokes = [{ type: "SOLID", color: { r: 48 / 255, g: 63 / 255, b: 159 / 255 } }]
    vector.strokeWeight = 2;
    vector.strokeJoin = "ROUND"
    return vector;
  }
  var selections = figma.currentPage.selection
  if (selections.length == 0) {
    figma.notify("请选择至少一条线")
    return
  }
  var lines = []
  for (const selection of selections) {
    if (selection.type == "LINE" || selection.type == "VECTOR") {
      lines.push(selection)
    }
  }
  if (lines.length == 0) {
    figma.notify("请选择至少一条线")
    return
  } else {
    var lineSelections = []
    for (const line of lines) {
      if (line.type == "LINE") {
        var startPoint = [line.x, line.y]
        var endPoint = [line.x + line.width * Math.cos(line.rotation / 180.0 * Math.PI), line.y - line.width * Math.sin(line.rotation / 180.0 * Math.PI)]
        console.log("startPoint:" + startPoint)
        console.log("endPoint:" + endPoint)
        var newVector = createVectorByPoints(
          [startPoint,
            [endPoint[0] - 50, startPoint[1]],
            [endPoint[0] - 50, endPoint[1]],
            endPoint])
        line.parent.appendChild(newVector)
        line.remove()
        lineSelections.push(newVector)
      }
      figma.currentPage.selection = lineSelections
    }
    // var vectorNetwork = lines[0].vectorNetwork
    // var vertices = vectorNetwork.vertices
    // for (const vertex of vertices) {
    //   console.log(vertex.x + "," + vertex.y + "\n" + vertex.strokeCap)
    // }
    // for (const line of lines) {
    //   line.strokes = [{ type: "SOLID", color: { b: 0.39215686274, g: 0.39215686274, r: 0.39215686274 } }]
    //   line.strokeWeight = 6;
    //   line.strokeCap = "ROUND"
    //   line.strokeJoin = "ROUND"
    // }
  }
}
function framesToComponents() {
  var selections = figma.currentPage.selection
  var newFrames = []
  for (const selection of selections) {
    if (selection.type == "FRAME") {
      newFrames.push(selection);
    }
  }
  if (newFrames.length == 0) {
    figma.notify("你至少给我选择一个 Frame 吧？")
  }
  for (const frame of newFrames) {
    var component = figma.createComponent()
    component.resizeWithoutConstraints(frame.width, frame.height)
    for (const child of frame.children) {
      component.appendChild(child.clone())
    }
    component.x = frame.x
    component.y = frame.y
    component.name = frame.name
    component.fills = frame.fills
    component.clipsContent = frame.clipsContent
    component.strokes = frame.strokes
    figma.currentPage.selection = figma.currentPage.selection.concat([component])
    frame.remove();
  }
}
function superCloneAndReplace() {
  var selections = figma.currentPage.selection
  var otherSelections = [];
  var tempInstance;
  if (selections.length >= 2) {
    for (var i = 0; i < selections.length; i++) {
      if (selections[i].type == "COMPONENT" || selections[i].name == "mother") {
        tempInstance = selections[i]
      } else {
        otherSelections.push(selections[i]);
      }
    }
    for (const selection of otherSelections) {
      var newInstance
      if (tempInstance.type == "COMPONENT") {
        newInstance = tempInstance.createInstance()
      } else {
        newInstance = tempInstance.clone()
      }
      figma.currentPage.appendChild(newInstance)
      newInstance.scaleFactor = selection.width / newInstance.width
      figma.currentPage.selection = [newInstance, selection]
      //将selection 的值赋给newInstance
      var selectionChild = selection.findAll(n => n.type == "TEXT")
      var newInstanceChild = newInstance.findAll(n => n.type == "TEXT")
      var count = selectionChild.length > newInstanceChild ? newInstanceChild : selectionChild.length
      console.log("最小数量：" + count)
      for (var i = 0; i < count; i++) {
        if (newInstanceChild[0].type == "TEXT" && selectionChild[0].type == "TEXT") {
          console.log("交换文字：" + newInstanceChild[0].characters + "-" + selectionChild[0].characters)
          newInstanceChild[0].characters == selectionChild[0].characters
          console.log("交换成功")
        }
      }
      exchangePosition()
      selection.remove()
      renameEverything()
    }
    figma.currentPage.selection = [tempInstance]
  }
}
function cloneAndReplace() {
  var selections = figma.currentPage.selection
  var otherSelections = [];
  var tempInstance;
  if (selections.length >= 2) {
    for (var i = 0; i < selections.length; i++) {
      if (selections[i].type == "COMPONENT" || selections[i].name == "mother") {
        tempInstance = selections[i]
      } else {
        otherSelections.push(selections[i]);
      }
    }
    for (const selection of otherSelections) {
      var newInstance
      if (tempInstance.type == "COMPONENT") {
        newInstance = tempInstance.createInstance()
      } else {
        newInstance = tempInstance.clone()
      }
      figma.currentPage.appendChild(newInstance)
      newInstance.scaleFactor = selection.width / newInstance.width
      figma.currentPage.selection = [newInstance, selection]
      exchangePosition()
      selection.remove()
      renameEverything()
    }
    figma.currentPage.selection = [tempInstance]
  }
}
function printObject() {
  var selections = figma.currentPage.selection;
  if (selections[0].type == "VECTOR") {
    console.log(selections[0].strokes)

    console.log(selections[0].strokeJoin)
  }
}
function log(object) {
  var str = object.toString()
  figma.notify(str)
  console.log(str)
}
function exchangePosition() {
  var selections = figma.currentPage.selection;
  if (selections.length == 2) {
    var tempParentNode0 = selections[0].parent;
    var tempParentNode1 = selections[1].parent;
    var tempX = selections[1].x
    var tempY = selections[1].y

    var index0 = getIndexInParent(selections[0].parent, selections[0])
    var index1 = getIndexInParent(selections[1].parent, selections[1])

    tempParentNode0.insertChild(index0, selections[1])
    selections[1].x = selections[0].x
    selections[1].y = selections[0].y

    tempParentNode1.insertChild(index1, selections[0])
    selections[0].x = tempX
    selections[0].y = tempY
  } else if (selections.length <= 1) {
    figma.notify("请至少选择两个画板")
  } else {
    var tempPositions = [selections[0].x, selections[0].y]
    var tempParent = selections[0].parent
    var indexs = []
    for (var j = 0; j < selections.length; j++) {
      indexs.push(getIndexInParent(selections[j].parent, selections[j]))
      console.log(j + "-" + indexs[j] + "-" + selections[j].name)
    }
    for (var i = 1; i < selections.length; i++) {
      selections[i - 1].x = selections[i].x
      selections[i - 1].y = selections[i].y
      selections[i].parent.insertChild(indexs[i], selections[i - 1])
    }
    selections[selections.length - 1].x = tempPositions[0]
    selections[selections.length - 1].y = tempPositions[1]
    tempParent.insertChild(indexs[0], selections[selections.length - 1])
  }
  function getIndexInParent(parent, child) {
    var children = parent.children
    var index = -1
    for (var i = 0; i < children.length; i++) {
      if (children[i].id == child.id) {
        index = i
      }
    }
    return index
  }
}
function renameEverything() {
  var selections = figma.currentPage.selection;
  if (selections.length == 0) {
    figma.notify("请先选择一个对象来进行命名")
    return
  }
  for (const selection of selections) {
    renameSelection(selection);
  }
  function renameSelection(selection) {
    //如果是文本图层
    if (selection.type == "TEXT") {
      selection.name = selection.characters
    } else if (selection.type == "RECTANGLE") {
      //如果是形状图层
      selection.name = "矩形 " + fills2String(selection.fills)
    } else if (selection.type == "POLYGON") {
      //多边形
      selection.name = numberConvertToUppercase(selection.pointCount) + (selection.pointCount <= 3 ? "角" : "边") + "形 " + fills2String(selection.fills)
    } else if (selection.type == "ELLIPSE") {
      //椭圆
      selection.name = (selection.width == selection.height ? "圆" : "椭圆") + " " + fills2String(selection.fills)
    } else if (selection.type == "LINE") {
      //线
      selection.name = "线 " + strokes2String(selection.strokes)
    } else if (selection.type == "STAR") {
      //星形
      selection.name = numberConvertToUppercase(selection.pointCount) + "角星 " + fills2String(selection.fills)
    } else if (selection.type == "VECTOR") {
      //形状
      selection.name = "矢量形状 " + fills2String(selection.fills)
    } else if (selection.type == "BOOLEAN_OPERATION") {
      //布尔形状
      selection.name = "复杂形状 " + fills2String(selection.fills)
    } else if (selection.type == "INSTANCE") {
      //实例
      var textNodes = selection.findAll(n => n.type == "TEXT")
      if (textNodes.length != 0) {
        var bigestTextNode = textNodes[0]
        for (var i = 1; i < textNodes.length; i++) {
          // @ts-ignore
          if (bigestTextNode.fontSize < textNodes[i].fontSize) {
            bigestTextNode = textNodes[i]
          }
        }
        // @ts-ignore
        selection.name = bigestTextNode.characters.replace("\n", "")
      }
      selection.name = "[" + splitText(selection.mainComponent.name) + "]" + selection.name
    } else if (selection.type == "GROUP") {
      //组
      var children = selection.children
      for (const child of children) {
        renameSelection(child)
      }
      var textNodes = selection.findAll(n => n.type == "TEXT")
      if (textNodes.length != 0) {
        var bigestTextNode = textNodes[0]
        for (var i = 1; i < textNodes.length; i++) {
          // @ts-ignore
          if (bigestTextNode.fontSize < textNodes[i].fontSize) {
            bigestTextNode = textNodes[i]
          }
        }
        // @ts-ignore
        selection.name = "[" + children.length + "]" + bigestTextNode.characters.replace("\n", "")
      }
    } else if (selection.type == "FRAME") {
      //框架
      var children = selection.children
      for (const child of children) {
        renameSelection(child)
      }
      var textNodes = selection.findAll(n => n.type == "TEXT")
      if (textNodes.length != 0) {
        var bigestTextNode = textNodes[0]
        for (var i = 0; i < textNodes.length; i++) {
          if (textNodes[i].name == "文档名称") {
            bigestTextNode = textNodes[i]
            break;
          }
          // @ts-ignore
          if (bigestTextNode.fontSize < textNodes[i].fontSize) {
            bigestTextNode = textNodes[i]
          }
        }
        // @ts-ignore
        selection.name = bigestTextNode.characters.replace("\n", "")
      }
    } else if (selection.type == "COMPONENT") {
      //组件
      var children = selection.children
      console.log("组件 " + children.length)
      for (const child of children) {
        console.log("子组件 " + child.type)
        renameSelection(child)
      }
    } else if (selection.type == "SLICE") {
      //切片
      selection.name = "切片 " + selection.width + "×" + selection.height
    }
  }

  //这边是一个特殊的方法，可以分析出路径中最后一级的名称
  function splitText(str) {
    var strArray = str.split("/")
    return strArray[strArray.length - 1]
  }
  function getAllTextLayer(node) {
    console.log("开始分析 " + node.type)
    var unitArray = new Array()
    if (node.type == "TEXT") {
      if (node.name.toString().charAt(0) != ".") {
        unitArray.push(node.characters)
      } else {
        console.log("忽略图层 " + node.name)
      }
    } else if (node.type == "INSTANCE") {
      var children = node.children
      for (const child of children) {
        unitArray = unitArray.concat(getAllTextLayer(child))
      }
    } else if (node.type == "GROUP" || node.type == "FRAME") {
      var children = node.children
      for (const child of children) {
        unitArray = unitArray.concat(getAllTextLayer(child))
      }
    }

    return unitArray
  }
  function fills2String(fills) {

    var str = ""
    for (const fill of fills) {
      console.log("fill.type:" + fill.type)
      if (fill.type == "SOLID") {
        //如果是纯色才允许添加
        str = color2Value(fill.color) + "|" + str
      } if (fill.type == "IMAGE") {
        str = "位图"
        return str
      }
    }
    if (fills.length > 0) {
      str = str.slice(0, -1)
    }
    if (str == undefined) {
      console.log("特殊矩形 " + fills)
    }
    return analyseColor(str)
  }
  function strokes2String(strokes) {
    var str = ""
    for (const stroke of strokes) {
      str = color2Value(stroke.color) + "|" + str
    }
    if (strokes.length > 0) {
      str = str.slice(0, -1)
    }
    return str
  }
  function color2Value(color) {
    console.log(color)
    var value = ""
      + value2String(color.r * 255)
      + value2String(color.g * 255)
      + value2String(color.b * 255)
    return value

    function value2String(value) {
      var prefix = ""
      if (value < 16) {
        prefix = "0"
      }
      return prefix + Math.round(value).toString(16).toUpperCase()
    }
  }
  //中文转数字函数
  function numberConvertToUppercase(num: number): string {
    const upperNumbers: string[] = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '百', '千', '万', '亿']
    const length: number = String(num).length
    if (length === 1) {
      return upperNumbers[num]
    } else if (length === 2) {
      if (num === 10) {
        return upperNumbers[num]
      } else if (num > 10 && num < 20) {
        const index: any = String(num)
        return '十' + upperNumbers[index.charAt(1)]
      } else {
        const index: any = String(num)
        return upperNumbers[index.charAt(0)] + '十' + upperNumbers[index.charAt(1)].replace('零', '')
      }
    } else {
      // TODO: 超出99暂不考虑
      return ''
    }
  }
  console.log("重新命名结束")
}

async function translate() {
  await figma.loadFontAsync({ family: "OPPOSans", style: "Regular" })
}
// Make sure to close the plugin when you're done. Otherwise the plugin will
// keep running, which shows the cancel button at the bottom of the screen.
//figma.closePlugin();

//分析颜色
function analyseColor(color) {
  var colorPalette = [
    {
      enName: "AliceBlue",
      name: "爱丽丝蓝",
      tone: "F0F8FF"
    },
    {
      enName: "AntiqueWhite",
      name: "古董白",
      tone: "FAEBD7"
    },
    {
      enName: "AquaMarine",
      name: "碧绿",
      tone: "7FFFD4"
    },
    {
      enName: "Azure",
      name: "青白色",
      tone: "F0FFFF"
    },
    {
      enName: "Beige",
      name: "米色",
      tone: "F5F5DC"
    },
    {
      enName: "Bisque",
      name: "陶坯黄",
      tone: "FFE4C4"
    },
    {
      enName: "Black",
      name: "黑色",
      tone: "000000"
    },
    {
      enName: "BlanchedAlmond",
      name: "杏仁白",
      tone: "FFEBCD"
    },
    {
      enName: "Blue",
      name: "蓝色",
      tone: "0000FF"
    },
    {
      enName: "BlueViolet",
      name: "蓝紫色",
      tone: "8A2BE2"
    },
    {
      enName: "Brown",
      name: "褐色",
      tone: "A52A2A"
    },
    {
      enName: "BurlyWood",
      name: "硬木褐",
      tone: "DEB887"
    },
    {
      enName: "CadetBlue",
      name: "军服蓝",
      tone: "5F9EA0"
    },
    {
      enName: "ChartReuse",
      name: "查特酒绿",
      tone: "7FFF00"
    },
    {
      enName: "Chocolate",
      name: "巧克力色",
      tone: "D2691E"
    },
    {
      enName: "Coral",
      name: "珊瑚红",
      tone: "FF7F50"
    },
    {
      enName: "CornFlowerBlue",
      name: "矢车菊蓝",
      tone: "6495ED"
    },
    {
      enName: "CornSilk",
      name: "玉米穗黄",
      tone: "FFF8DC"
    },
    {
      enName: "Crimson",
      name: "绯红",
      tone: "DC143C"
    },
    {
      enName: "Cyan/Aqua",
      name: "青色",
      tone: "00FFFF"
    },
    {
      enName: "DarkBlue",
      name: "深蓝",
      tone: "00008B"
    },
    {
      enName: "DarkCyan",
      name: "深青",
      tone: "008B8B"
    },
    {
      enName: "DarkGoldenRod",
      name: "深金菊黄",
      tone: "B8860B"
    },
    {
      enName: "DarkGray",
      name: "暗灰",
      tone: "A9A9A9"
    },
    {
      enName: "DarkGreen",
      name: "深绿",
      tone: "006400"
    },
    {
      enName: "DarkKhaki",
      name: "深卡其色",
      tone: "BDB76B"
    },
    {
      enName: "DarkMagenta",
      name: "深品红",
      tone: "8B008B"
    },
    {
      enName: "DarkOliveGreen",
      name: "深橄榄绿",
      tone: "556B2F"
    },
    {
      enName: "DarkOrange",
      name: "深橙",
      tone: "FF8C00"
    },
    {
      enName: "DarkOrchid",
      name: "深洋兰紫",
      tone: "9932CC"
    },
    {
      enName: "DarkRed",
      name: "深红",
      tone: "8B0000"
    },
    {
      enName: "DarkSalmon",
      name: "深鲑红",
      tone: "E9967A"
    },
    {
      enName: "DarkSeaGreen",
      name: "深海藻绿",
      tone: "8FBC8F"
    },
    {
      enName: "DarkSlateBlue",
      name: "深岩蓝",
      tone: "483D8B"
    },
    {
      enName: "DarkSlateGray",
      name: "深岩灰",
      tone: "2F4F4F"
    },
    {
      enName: "DarkTurquoise",
      name: "深松石绿",
      tone: "00CED1"
    },
    {
      enName: "DarkViolet",
      name: "深紫",
      tone: "9400d3"
    },
    {
      enName: "DeepPink",
      name: "深粉",
      tone: "FF1493"
    },
    {
      enName: "DeepSkyBlue",
      name: "深天蓝",
      tone: "00BFFF"
    },
    {
      enName: "DimGray",
      name: "昏灰",
      tone: "696969"
    },
    {
      enName: "DodgerBlue",
      name: "湖蓝",
      tone: "1E90FF"
    },
    {
      enName: "FireBrick",
      name: "火砖红",
      tone: "B22222"
    },
    {
      enName: "FloralWhite",
      name: "花卉白",
      tone: "FFFAF0"
    },
    {
      enName: "ForestGreen",
      name: "森林绿",
      tone: "228B22"
    },
    {
      enName: "GainsBoro",
      name: "庚氏灰",
      tone: "DCDCDC"
    },
    {
      enName: "GhostWhite",
      name: "幽灵白",
      tone: "F8F8FF"
    },
    {
      enName: "Gold",
      name: "金色",
      tone: "FFD700"
    },
    {
      enName: "GoldenRod",
      name: "金菊黄",
      tone: "DAA520"
    },
    {
      enName: "Gray",
      name: "灰色",
      tone: "808080"
    },
    {
      enName: "Green",
      name: "调和绿",
      tone: "008000"
    },
    {
      enName: "GreenYellow",
      name: "黄绿色",
      tone: "ADFF2F"
    },
    {
      enName: "HoneyDew",
      name: "蜜瓜绿",
      tone: "F0FFF0"
    },
    {
      enName: "HotPink",
      name: "艳粉",
      tone: "FF69B4"
    },
    {
      enName: "IndianRed",
      name: "印度红",
      tone: "CD5C5C"
    },
    {
      enName: "Indigo",
      name: "靛蓝",
      tone: "4B0082"
    },
    {
      enName: "Ivory",
      name: "象牙白",
      tone: "FFFFF0"
    },
    {
      enName: "Khaki",
      name: "卡其色",
      tone: "F0E68C"
    },
    {
      enName: "Lavender",
      name: "薰衣草紫",
      tone: "E6E6FA"
    },
    {
      enName: "LavenderBlush",
      name: "薰衣草红",
      tone: "FFF0F5"
    },
    {
      enName: "LawnGreen",
      name: "草坪绿",
      tone: "7CFC00"
    },
    {
      enName: "LemonChiffon",
      name: "柠檬绸黄",
      tone: "FFFACD"
    },
    {
      enName: "LightBlue",
      name: "浅蓝",
      tone: "ADD8E6"
    },
    {
      enName: "LightCoral",
      name: "浅珊瑚红",
      tone: "F08080"
    },
    {
      enName: "LightCyan",
      name: "浅青",
      tone: "E0FFFF"
    },
    {
      enName: "LightGoldenRodYellow",
      name: "浅金菊黄",
      tone: "FAFAD2"
    },
    {
      enName: "LightGray",
      name: "亮灰",
      tone: "D3D3D3"
    },
    {
      enName: "LightGreen",
      name: "浅绿",
      tone: "90EE90"
    },
    {
      enName: "LightPink",
      name: "浅粉",
      tone: "FFB6C1"
    },
    {
      enName: "LightSalmon",
      name: "浅鲑红",
      tone: "FFA07A"
    },
    {
      enName: "LightSeaGreen",
      name: "浅海藻绿",
      tone: "20B2AA"
    },
    {
      enName: "LightSkyBlue",
      name: "浅天蓝",
      tone: "87CEFA"
    },
    {
      enName: "LightSlateGray",
      name: "浅岩灰",
      tone: "778899"
    },
    {
      enName: "LightSteelBlue",
      name: "浅钢青",
      tone: "0C4DE"
    },
    {
      enName: "LightYellow",
      name: "浅黄",
      tone: "FFFFE0"
    },
    {
      enName: "Lime",
      name: "绿色",
      tone: "00FF00"
    },
    {
      enName: "LimeGreen",
      name: "青柠绿",
      tone: "32CD32"
    },
    {
      enName: "Linen",
      name: "亚麻色",
      tone: "FAF0E6"
    },
    {
      enName: "Magenta/Fuchsia",
      name: "洋红",
      tone: "FF00FF"
    },
    {
      enName: "Maroon",
      name: "栗色",
      tone: "800000"
    },
    {
      enName: "MediumAquaMarine",
      name: "中碧绿",
      tone: "66CDAA"
    },
    {
      enName: "MediumBlue",
      name: "中蓝",
      tone: "0000CD"
    },
    {
      enName: "MediumOrchid",
      name: "中洋兰紫",
      tone: "BA55D3"
    },
    {
      enName: "MediumPurple",
      name: "中紫",
      tone: "9370D8"
    },
    {
      enName: "MediumSeaGreen",
      name: "中海藻绿",
      tone: "3CB371"
    },
    {
      enName: "MediumSlateBlue",
      name: "中岩蓝",
      tone: "7B68EE"
    },
    {
      enName: "MediumSpringGreen",
      name: "中嫩绿",
      tone: "00FA9A"
    },
    {
      enName: "MediumTurquoise",
      name: "中松石绿",
      tone: "48D1CC"
    },
    {
      enName: "MediumVioletRed",
      name: "中紫红",
      tone: "C71585"
    },
    {
      enName: "MidNightBlue",
      name: "午夜蓝",
      tone: "191970"
    },
    {
      enName: "MintCream",
      name: "薄荷乳白",
      tone: "F5FFFA"
    },
    {
      enName: "MistyRose",
      name: "雾玫瑰红",
      tone: "FFE4E1"
    },
    {
      enName: "Moccasin",
      name: "鹿皮色",
      tone: "FFE4B5"
    },
    {
      enName: "NavajoWhite",
      name: "土著白",
      tone: "FFDEAD"
    },
    {
      enName: "Navy",
      name: "藏青",
      tone: "000080"
    },
    {
      enName: "OldLace",
      name: "旧蕾丝白",
      tone: "FDF5E6"
    },
    {
      enName: "Olive",
      name: "橄榄色",
      tone: "808000"
    },
    {
      enName: "OliveDrab",
      name: "橄榄绿",
      tone: "6B8E23"
    },
    {
      enName: "Orange",
      name: "橙色",
      tone: "FFA500"
    },
    {
      enName: "OrangeRed",
      name: "橘红",
      tone: "FF4500"
    },
    {
      enName: "Orchid",
      name: "洋兰紫",
      tone: "DA70D6"
    },
    {
      enName: "PaleGoldenRod",
      name: "白金菊黄",
      tone: "EEE8AA"
    },
    {
      enName: "PaleGreen",
      name: "白绿色",
      tone: "98FB98"
    },
    {
      enName: "PaleTurquoise",
      name: "白松石绿",
      tone: "AFEEEE"
    },
    {
      enName: "PaleVioletRed",
      name: "白紫红",
      tone: "D87093"
    },
    {
      enName: "PapayaWhip",
      name: "番木瓜橙",
      tone: "FFEFD5"
    },
    {
      enName: "PeachPuff",
      name: "粉扑桃色",
      tone: "FFDAB9"
    },
    {
      enName: "Peru",
      name: "秘鲁红",
      tone: "CD853F"
    },
    {
      enName: "Pink",
      name: "粉色",
      tone: "FFC0CB"
    },
    {
      enName: "Plum",
      name: "李紫",
      tone: "DDA0DD"
    },
    {
      enName: "PowderBlue",
      name: "粉末蓝",
      tone: "B0E0E6"
    },
    {
      enName: "Purple",
      name: "紫色",
      tone: "800080"
    },
    {
      enName: "Red",
      name: "红色",
      tone: "FF0000"
    },
    {
      enName: "RosyBrown",
      name: "玫瑰褐",
      tone: "BC8F8F"
    },
    {
      enName: "RoyalBlue",
      name: "品蓝",
      tone: "4169E1"
    },
    {
      enName: "SaddleBrown",
      name: "鞍褐",
      tone: "8B4513"
    },
    {
      enName: "Salmon",
      name: "鲑红",
      tone: "FA8072"
    },
    {
      enName: "SandyBrown",
      name: "沙褐",
      tone: "F4A460"
    },
    {
      enName: "SeaGreen",
      name: "海藻绿",
      tone: "2E8B57"
    },
    {
      enName: "SeaShell",
      name: "贝壳白",
      tone: "FFF5EE"
    },
    {
      enName: "Sienna",
      name: "土黄赭",
      tone: "A0522D"
    },
    {
      enName: "Silver",
      name: "银色",
      tone: "C0C0C0"
    },
    {
      enName: "SkyBlue",
      name: "天蓝",
      tone: "87CEEB"
    },
    {
      enName: "SlateBlue",
      name: "岩蓝",
      tone: "6A5ACD"
    },
    {
      enName: "SlateGray",
      name: "岩灰",
      tone: "708090"
    },
    {
      enName: "Snow",
      name: "雪白",
      tone: "FFFAFA"
    },
    {
      enName: "SpringGreen",
      name: "春绿",
      tone: "00FF7F"
    },
    {
      enName: "SteelBlue",
      name: "钢青",
      tone: "4682B4"
    },
    {
      enName: "Tan",
      name: "日晒褐",
      tone: "D2B48C"
    },
    {
      enName: "Teal",
      name: "鸭翅绿",
      tone: "008080"
    },
    {
      enName: "Thistle",
      name: "蓟紫",
      tone: "D8BFD8"
    },
    {
      enName: "Tomato",
      name: "番茄红",
      tone: "FF6347"
    },
    {
      enName: "Turquoise",
      name: "松石绿",
      tone: "40E0D0"
    },
    {
      enName: "Violet",
      name: "紫罗兰色",
      tone: "EE82EE"
    },
    {
      enName: "Wheat",
      name: "麦色",
      tone: "F5DEB3"
    },
    {
      enName: "White",
      name: "白色",
      tone: "FFFFFF"
    },
    {
      enName: "WhiteSmoke",
      name: "烟雾白",
      tone: "F5F5F5"
    },
    {
      enName: "Yellow",
      name: "黄色",
      tone: "FFFF00"
    },
    {
      enName: "YellowGreen",
      name: "暗黄绿色",
      tone: "9ACD32"
    }
  ]
  var compareValues = [];
  for (const standardColor of colorPalette) {
    var tempValue = -1;
    var standardRGB = toneToRGB(standardColor.tone);
    var colorRGB = toneToRGB(color)
    tempValue = (colorRGB.r - standardRGB.r) * (colorRGB.r - standardRGB.r) + (colorRGB.g - standardRGB.g) * (colorRGB.g - standardRGB.g) + (colorRGB.b - standardRGB.b) * (colorRGB.b - standardRGB.b)
    compareValues.push(tempValue)
  }
  var similarColorIndex = 0;
  for (var i = 0; i < compareValues.length; i++) {
    if (compareValues[similarColorIndex] > compareValues[i]) {
      similarColorIndex = i
    }
  }
  console.log(colorPalette[similarColorIndex].name + "比较值:" + compareValues[similarColorIndex])
  return colorPalette[similarColorIndex].name
}

//导出画板为pdf
function exportSelectedFramesToPDF() {
  console.log("开始导出画板")
  var selections = figma.currentPage.selection;
  var frames = [];
  for (const selection of selections) {
    if (selection.type == "FRAME") {
      frames.push(selection)
    }
  }
  if (frames.length == 0) {
    figma.notify("请至少选中一个 Frame")
    return;
  }
  //frame 排序
  function sortByY(a, b) {
    return a.y - b.y
  }
  frames.sort(sortByY)
  //创建一个page
  var newPage = figma.createPage()
  var pagename = frames[0].name + " 交互设计 " + getStandardTime()
  var cloneFrames = []
  for (const frame of frames) {
    var cloneFrame = frame.clone()
    cloneFrames.push(cloneFrame)
    newPage.appendChild(cloneFrame)
  }
  figma.currentPage.selection = []
  figma.currentPage = newPage
  figma.currentPage.selection = cloneFrames;
  newPage.name = pagename
  //还差一个访问剪切板的方法
}
//工具类
//1.把颜色得到16进制转为3个RGB
function toneToRGB(tone) {
  var r = parseInt(tone.substring(0, 2), 16)
  var g = parseInt(tone.substring(2, 4), 16)
  var b = parseInt(tone.substring(4, 6), 16)
  return {
    r: r,
    g: g,
    b: b
  }
}
//2.获得当前时间
function getStandardTime() {
  var date = new Date();
  var month = date.getMonth();
  month += 1;
  var month2 = month + ""
  if (month < 10) {
    month2 = "0" + month2
  }

  var day = date.getDate();
  var day2 = day + ""
  if (day < 10) {
    day2 = "0" + day2
  }
  return "" + date.getFullYear() + month2 + day2;
}