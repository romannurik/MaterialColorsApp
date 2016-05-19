var colors = {
  'red': {
    '50':   {color: '#FFEBEE'},
    '100':  {color: '#FFCDD2'},
    '200':  {color: '#EF9A9A'},
    '300':  {color: '#E57373'},
    '400':  {color: '#EF5350', white: true},
    '500':  {color: '#F44336', white: true},
    '600':  {color: '#E53935', white: true},
    '700':  {color: '#D32F2F', white: true},
    '800':  {color: '#C62828', white: true},
    '900':  {color: '#B71C1C', white: true},
    'a100': {color: '#FF8A80'},
    'a200': {color: '#FF5252', white: true},
    'a400': {color: '#FF1744', white: true},
    'a700': {color: '#D50000', white: true}
  },
  'pink': {
    '50':   {color: '#FCE4EC'},
    '100':  {color: '#F8BBD0'},
    '200':  {color: '#F48FB1'},
    '300':  {color: '#F06292', white: true},
    '400':  {color: '#EC407A', white: true},
    '500':  {color: '#E91E63', white: true},
    '600':  {color: '#D81B60', white: true},
    '700':  {color: '#C2185B', white: true},
    '800':  {color: '#AD1457', white: true},
    '900':  {color: '#880E4F', white: true},
    'a100': {color: '#FF80AB'},
    'a200': {color: '#FF4081', white: true},
    'a400': {color: '#F50057', white: true},
    'a700': {color: '#C51162', white: true}
  },
  'purple': {
    '50':   {color: '#F3E5F5'},
    '100':  {color: '#E1BEE7'},
    '200':  {color: '#CE93D8'},
    '300':  {color: '#BA68C8', white: true},
    '400':  {color: '#AB47BC', white: true},
    '500':  {color: '#9C27B0', white: true},
    '600':  {color: '#8E24AA', white: true},
    '700':  {color: '#7B1FA2', white: true},
    '800':  {color: '#6A1B9A', white: true},
    '900':  {color: '#4A148C', white: true},
    'a100': {color: '#EA80FC'},
    'a200': {color: '#E040FB', white: true},
    'a400': {color: '#D500F9', white: true},
    'a700': {color: '#AA00FF', white: true}
  },
  'deep-purple': {
    '50':   {color: '#EDE7F6'},
    '100':  {color: '#D1C4E9'},
    '200':  {color: '#B39DDB'},
    '300':  {color: '#9575CD', white: true},
    '400':  {color: '#7E57C2', white: true},
    '500':  {color: '#673AB7', white: true},
    '600':  {color: '#5E35B1', white: true},
    '700':  {color: '#512DA8', white: true},
    '800':  {color: '#4527A0', white: true},
    '900':  {color: '#311B92', white: true},
    'a100': {color: '#B388FF'},
    'a200': {color: '#7C4DFF', white: true},
    'a400': {color: '#651FFF', white: true},
    'a700': {color: '#6200EA', white: true}
  },
  'indigo': {
    '50':   {color: '#E8EAF6'},
    '100':  {color: '#C5CAE9'},
    '200':  {color: '#9FA8DA'},
    '300':  {color: '#7986CB', white: true},
    '400':  {color: '#5C6BC0', white: true},
    '500':  {color: '#3F51B5', white: true},
    '600':  {color: '#3949AB', white: true},
    '700':  {color: '#303F9F', white: true},
    '800':  {color: '#283593', white: true},
    '900':  {color: '#1A237E', white: true},
    'a100': {color: '#8C9EFF'},
    'a200': {color: '#536DFE', white: true},
    'a400': {color: '#3D5AFE', white: true},
    'a700': {color: '#304FFE', white: true}
  },
  'blue': {
    '50':   {color: '#E3F2FD'},
    '100':  {color: '#BBDEFB'},
    '200':  {color: '#90CAF9'},
    '300':  {color: '#64B5F6'},
    '400':  {color: '#42A5F5'},
    '500':  {color: '#2196F3', white: true},
    '600':  {color: '#1E88E5', white: true},
    '700':  {color: '#1976D2', white: true},
    '800':  {color: '#1565C0', white: true},
    '900':  {color: '#0D47A1', white: true},
    'a100': {color: '#82B1FF'},
    'a200': {color: '#448AFF', white: true},
    'a400': {color: '#2979FF', white: true},
    'a700': {color: '#2962FF', white: true}
  },
  'light-blue': {
    '50':   {color: '#E1F5FE'},
    '100':  {color: '#B3E5FC'},
    '200':  {color: '#81D4FA'},
    '300':  {color: '#4FC3F7'},
    '400':  {color: '#29B6F6'},
    '500':  {color: '#03A9F4'},
    '600':  {color: '#039BE5', white: true},
    '700':  {color: '#0288D1', white: true},
    '800':  {color: '#0277BD', white: true},
    '900':  {color: '#01579B', white: true},
    'a100': {color: '#80D8FF'},
    'a200': {color: '#40C4FF'},
    'a400': {color: '#00B0FF'},
    'a700': {color: '#0091EA', white: true}
  },
  'cyan': {
    '50':   {color: '#E0F7FA'},
    '100':  {color: '#B2EBF2'},
    '200':  {color: '#80DEEA'},
    '300':  {color: '#4DD0E1'},
    '400':  {color: '#26C6DA'},
    '500':  {color: '#00BCD4'},
    '600':  {color: '#00ACC1'},
    '700':  {color: '#0097A7', white: true},
    '800':  {color: '#00838F', white: true},
    '900':  {color: '#006064', white: true},
    'a100': {color: '#84FFFF'},
    'a200': {color: '#18FFFF'},
    'a400': {color: '#00E5FF'},
    'a700': {color: '#00B8D4'}
  },
  'teal': {
    '50':   {color: '#E0F2F1'},
    '100':  {color: '#B2DFDB'},
    '200':  {color: '#80CBC4'},
    '300':  {color: '#4DB6AC'},
    '400':  {color: '#26A69A'},
    '500':  {color: '#009688', white: true},
    '600':  {color: '#00897B', white: true},
    '700':  {color: '#00796B', white: true},
    '800':  {color: '#00695C', white: true},
    '900':  {color: '#004D40', white: true},
    'a100': {color: '#A7FFEB'},
    'a200': {color: '#64FFDA'},
    'a400': {color: '#1DE9B6'},
    'a700': {color: '#00BFA5'}
  },
  'green': {
    '50':   {color: '#E8F5E9'},
    '100':  {color: '#C8E6C9'},
    '200':  {color: '#A5D6A7'},
    '300':  {color: '#81C784'},
    '400':  {color: '#66BB6A'},
    '500':  {color: '#4CAF50'},
    '600':  {color: '#43A047', white: true},
    '700':  {color: '#388E3C', white: true},
    '800':  {color: '#2E7D32', white: true},
    '900':  {color: '#1B5E20', white: true},
    'a100': {color: '#B9F6CA'},
    'a200': {color: '#69F0AE'},
    'a400': {color: '#00E676'},
    'a700': {color: '#00C853'}
  },
  'light-green': {
    '50':   {color: '#F1F8E9'},
    '100':  {color: '#DCEDC8'},
    '200':  {color: '#C5E1A5'},
    '300':  {color: '#AED581'},
    '400':  {color: '#9CCC65'},
    '500':  {color: '#8BC34A'},
    '600':  {color: '#7CB342'},
    '700':  {color: '#689F38', white: true},
    '800':  {color: '#558B2F', white: true},
    '900':  {color: '#33691E', white: true},
    'a100': {color: '#CCFF90'},
    'a200': {color: '#B2FF59'},
    'a400': {color: '#76FF03'},
    'a700': {color: '#64DD17'}
  },
  'lime': {
    '50':   {color: '#F9FBE7'},
    '100':  {color: '#F0F4C3'},
    '200':  {color: '#E6EE9C'},
    '300':  {color: '#DCE775'},
    '400':  {color: '#D4E157'},
    '500':  {color: '#CDDC39'},
    '600':  {color: '#C0CA33'},
    '700':  {color: '#AFB42B'},
    '800':  {color: '#9E9D24'},
    '900':  {color: '#827717', white: true},
    'a100': {color: '#F4FF81'},
    'a200': {color: '#EEFF41'},
    'a400': {color: '#C6FF00'},
    'a700': {color: '#AEEA00'}
  },
  'yellow': {
    '50':   {color: '#FFFDE7'},
    '100':  {color: '#FFF9C4'},
    '200':  {color: '#FFF59D'},
    '300':  {color: '#FFF176'},
    '400':  {color: '#FFEE58'},
    '500':  {color: '#FFEB3B'},
    '600':  {color: '#FDD835'},
    '700':  {color: '#FBC02D'},
    '800':  {color: '#F9A825'},
    '900':  {color: '#F57F17'},
    'a100': {color: '#FFFF8D'},
    'a200': {color: '#FFFF00'},
    'a400': {color: '#FFEA00'},
    'a700': {color: '#FFD600'}
  },
  'amber': {
    '50':   {color: '#FFF8E1'},
    '100':  {color: '#FFECB3'},
    '200':  {color: '#FFE082'},
    '300':  {color: '#FFD54F'},
    '400':  {color: '#FFCA28'},
    '500':  {color: '#FFC107'},
    '600':  {color: '#FFB300'},
    '700':  {color: '#FFA000'},
    '800':  {color: '#FF8F00'},
    '900':  {color: '#FF6F00'},
    'a100': {color: '#FFE57F'},
    'a200': {color: '#FFD740'},
    'a400': {color: '#FFC400'},
    'a700': {color: '#FFAB00'}
  },
  'orange': {
    '50':   {color: '#FFF3E0'},
    '100':  {color: '#FFE0B2'},
    '200':  {color: '#FFCC80'},
    '300':  {color: '#FFB74D'},
    '400':  {color: '#FFA726'},
    '500':  {color: '#FF9800'},
    '600':  {color: '#FB8C00'},
    '700':  {color: '#F57C00'},
    '800':  {color: '#EF6C00', white: true},
    '900':  {color: '#E65100', white: true},
    'a100': {color: '#FFD180'},
    'a200': {color: '#FFAB40'},
    'a400': {color: '#FF9100'},
    'a700': {color: '#FF6D00'}
  },
  'deep-orange': {
    '50':   {color: '#FBE9E7'},
    '100':  {color: '#FFCCBC'},
    '200':  {color: '#FFAB91'},
    '300':  {color: '#FF8A65'},
    '400':  {color: '#FF7043'},
    '500':  {color: '#FF5722', white: true},
    '600':  {color: '#F4511E', white: true},
    '700':  {color: '#E64A19', white: true},
    '800':  {color: '#D84315', white: true},
    '900':  {color: '#BF360C', white: true},
    'a100': {color: '#FF9E80'},
    'a200': {color: '#FF6E40'},
    'a400': {color: '#FF3D00', white: true},
    'a700': {color: '#DD2C00', white: true}
  },
  'brown': {
    '50':   {color: '#EFEBE9'},
    '100':  {color: '#D7CCC8'},
    '200':  {color: '#BCAAA4'},
    '300':  {color: '#A1887F', white: true},
    '400':  {color: '#8D6E63', white: true},
    '500':  {color: '#795548', white: true},
    '600':  {color: '#6D4C41', white: true},
    '700':  {color: '#5D4037', white: true},
    '800':  {color: '#4E342E', white: true},
    '900':  {color: '#3E2723', white: true}
  },
  'grey': {
    '50':   {color: '#FAFAFA'},
    '100':  {color: '#F5F5F5'},
    '200':  {color: '#EEEEEE'},
    '300':  {color: '#E0E0E0'},
    '400':  {color: '#BDBDBD'},
    '500':  {color: '#9E9E9E'},
    '600':  {color: '#757575', white: true},
    '700':  {color: '#616161', white: true},
    '800':  {color: '#424242', white: true},
    '900':  {color: '#212121', white: true}
  },
  'blue-grey': {
    '50':   {color: '#ECEFF1'},
    '100':  {color: '#CFD8DC'},
    '200':  {color: '#B0BEC5'},
    '300':  {color: '#90A4AE'},
    '400':  {color: '#78909C', white: true},
    '500':  {color: '#607D8B', white: true},
    '600':  {color: '#546E7A', white: true},
    '700':  {color: '#455A64', white: true},
    '800':  {color: '#37474F', white: true},
    '900':  {color: '#263238', white: true}
  }
};

function colorDifference(a, b) {
  return Math.sqrt(Math.pow(getRed(a) - getRed(b), 2) +
                   Math.pow(getGreen(a) - getGreen(b), 2) +
                   Math.pow(getBlue(a) - getBlue(b), 2));
}

function getRed(color) {
  return (parseInt(color, 16) & 0xffffff) >> 16;
}

function getGreen(color) {
  return (parseInt(color, 16) & 0x00ffff) >> 8;
}

function getBlue(color) {
  return parseInt(color, 16) & 0x0000ff;
}

function getAllColors() {
  var allColors = [];

  Object.keys(colors).map(function(hue) {
    Object.keys(colors[hue]).map(function(variation) {
      allColors.push(colors[hue][variation].color.slice(1));
    });
  });

  return allColors;
}

var inputColor = '0000FF';

var closest =
  getAllColors()
  .map(function(color) {
    return {
      color: color,
      difference: colorDifference(inputColor, color)
    };
  })
  .reduce(function(a, b) {
    return (b.difference < a.difference) ? b : a;
   }, {difference: Infinity});

console.log(closest);

// blue & indigo A700
// console.log('blue & indigo A700:');
// console.log(colorDifference('0000FF', '304FFE'));

// console.log('blue & indigo A700:');
// console.log(colorDifference('0000FF', '304FFE'));
