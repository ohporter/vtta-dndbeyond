import DICTIONARY from '../dictionary.js';
import utils from '../../utils.js';

/**
 * Gets the sourcebook for a subset of dndbeyond sources
 * @param {obj} data Item data
 */
let getSource = data => {
  if (data.definition.sourceId) {
    let source = DICTIONARY.sources.find(
      source => source.id === data.definition.sourceId
    );
    if (source) {
      return data.definition.sourcePageNumber
        ? `${source.name} pg. ${data.definition.sourcePageNumber}`
        : source.name;
    }
  }
  return '';
};

export default function parseClasses(ddb, character) {
  let items = [];

  ddb.character.classes.forEach(characterClass => {
    let item = {
      name: characterClass.definition.name,
      type: 'class',
      data: JSON.parse(utils.getTemplate('class')),
    };

    item.data.description = {
      value: characterClass.definition.description,
      chat: characterClass.definition.description,
      unidentified: false,
    };
    item.data.levels = characterClass.level;
    item.data.source = getSource(characterClass);

    if (
      characterClass.subclassDefinition &&
      characterClass.subclassDefinition.name
    ) {
      item.data.subclass = characterClass.subclassDefinition.name;

      // update the description
      item.data.description.value +=
        '<p><strong>' + item.data.subclass + '</strong></p>';
      item.data.description.value +=
        characterClass.subclassDefinition.description;
    }

    item.data.hitDice = `d${characterClass.definition.hitDice}`;

    // There class object supports skills granted by the class.
    // Lets find and add them for future compatibility.
    const classIds =  characterClass.definition.classFeatures
      .map(feature => feature.id)
      .concat((!!characterClass.subclassDefinition) ?
        characterClass.subclassDefinition.classFeatures.map(feature => feature.id) :
        []);

    const profs = DICTIONARY.character.skills.map(skill => {
      return ddb.character.modifiers.class
      .filter(mod =>
        mod.friendlySubtypeName === skill.label &&
        classIds.includes(mod.componentId))
      .map(f => skill.name);
    }).flat();

    item.data.skills = {
      value: profs
    }

    const castSpells = (characterClass.definition.canCastSpells ||
      (characterClass.subclassDefinition && characterClass.subclassDefinition.canCastSpells));

    if (castSpells) {
      item.data.spellcasting = DICTIONARY.spell.progression.find(
        cls => cls.name === characterClass.definition.name).value;
    } else {
      item.data.spellcasting = ""
    }

    items.push(item);
  });

  return items;
}
