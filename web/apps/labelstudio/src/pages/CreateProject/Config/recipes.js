export const recipes = [
  {
    title: "图像矩形框标注",
    type: "community",
    group: "计算机视觉",
    image: "bbox.png",
    details: `<h1>图像矩形框</h1>
    <p>对图像中的对象绘制矩形框。</p>
    <p>适用于目标检测和分类。</p>`,
    config: `<View>
  <Image name="image" value="$image"/>
  <RectangleLabels name="label" toName="image">
    <Label value="飞机" background="green"/>
    <Label value="汽车" background="blue"/>
  </RectangleLabels>
</View>`,
  },
  {
    title: "多边形分割",
    type: "community",
    group: "计算机视觉",
    image: "polygon.png",
    details: "",
    config: `<View>
  <Header value="绘制多边形以进行分割"/>
  <Image name="image" value="$image"/>
  <PolygonLabels name="label" toName="image"
                 strokeWidth="3" pointSize="small"
                 opacity="0.9">
    <Label value="建筑" background="red"/>
    <Label value="道路" background="blue"/>
  </PolygonLabels>
</View>
`,
  },
  {
    title: "文本分类",
    type: "community",
    group: "自然语言",
    image: "text.png",
    config: `<View>
  <Labels name="label" toName="text">
    <Label value="体育" background="red"/>
    <Label value="财经" background="darkorange"/>
    <Label value="科技" background="orange"/>
    <Label value="娱乐" background="green"/>
    <Label value="政治" background="darkblue"/>
    <Label value="教育" background="blue"/>
    <Label value="健康" background="purple"/>
    <Label value="文化" background="#842"/>
    <Label value="国际" background="#428"/>
    <Label value="社会" background="#482"/>
    <Label value="军事" background="rgba(0,0,0,0.8)"/>
  </Labels>

  <Text name="text" value="$text"/>
</View>`,
  },
];
