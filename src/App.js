import React, {Component} from 'react'
import {Switch, Route} from 'react-router-dom'
import {Link} from 'react-router-dom'
import 'antd/dist/antd.css';
import './App.css'
import {withRouter} from 'react-router-dom';
import {shownTags} from './shown-tags.js';

import {Layout, Menu, Input, Card, Row, Col, Icon, Modal, Tag, Form} from 'antd';

const {TextArea, Search} = Input;
const {Header, Content, Footer} = Layout;

const cardShadow = {WebkitBoxShadow: '1px 1px 10px #eee', boxShadow: '1px 1px 10px #eee'};
const server = process.env.REACT_APP_BACKEND_URL || '';


class PageRenderer extends Component {
  render() {
    return <div>
      <Link to={'/edit/' + this.props.uuid} style={{
        position: 'absolute',
        top: '24px',
        right: '24px'
      }}><Icon type="edit" onClick={this.cancel} style={{fontSize: '2em', color: '#888'}}/></Link>
      <h1>{this.props.title}</h1>
      <p><i>{this.props.description}</i></p>
      <h2>Ingredients</h2>
      {Object.keys(this.props.ingredientCategories).map(tableName => (
        <div>
          {tableName.length === 0 ? <div/> : <h3>{tableName}</h3>}
          <ul>
            {this.props.ingredientCategories[tableName].map(ingredient => {
              return <li key={ingredient}>{ingredient}</li>;
            })}
          </ul>
        </div>
      ))}
      <h2>Directions</h2>
      <p>{this.props.directions}</p>
      {this.props.notes ? <p>{this.props.notes}</p> : <div/>}
    </div>;
  }
}

class _EditCard extends Component {
  props = {};
  state = {
    uuid: undefined,
    title: '',
    description: '',
    ingredientCategories: {},
    directions: '',
    notes: '',
    tags: []
  };

  parseIngredientGroups = text => {
    const parts = [''].concat(text.trim().split(/^\s*(?:=|-){3}\s*([^\n]+)\s*(?:=|-){3}\s*$/gm));
    const groups = {};
    for (let i = 1; i < parts.length; i += 2) {
      groups[parts[i - 1]] = parts[i].replace(/^\s*-\s*/gm, '').split('\n').map(x => x.trim()).filter(Boolean)
    }
    return groups;
  };

  update = (name, event) => {
    this.setState({[name]: event.target.value});
  };

  updater = (name) => {
    return event => {
      this.update(name, event);
    };
  };

  componentDidMount() {
    this.setState({...this.state, ...this.props});
  }

  submit = () => {
    let r;
    if (this.state.uuid) {
      r = fetch(server + '/recipes/' + this.state.uuid, {
        method: 'PUT',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.state), // body data type must match "Content-Type" header
      })
    } else {
      r = fetch(server + '/recipes', {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.state), // body data type must match "Content-Type" header
      })
    }
    r.then(r => r.json()).then(recipe => {
      this.props.history.push('/view/' + recipe.uuid);
    });
  };
  handleLeave = onLeave => {
    Modal.confirm({
      title: 'Are you sure you want to leave?',
      content: 'The new recipe will be lost.',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: () => {
        onLeave();
      },
      onCancel() {
      }
    });
  };
  cancel = () => {
    if (this.state.uuid) {
      Modal.confirm({
        title: 'Are you sure you want to delete this recipe?',
        content: 'This will permanently delete it.',
        okText: 'Yes',
        okType: 'danger',
        cancelText: 'No',
        onOk: () => {
          fetch(server + '/recipes/' + this.state.uuid, {
            method: 'DELETE',
            mode: 'cors',
            headers: {
              'Content-Type': 'application/json'
            }
          }).then(r => {
            this.props.history.push('/');
          });
        },
        onCancel() {
        }
      });
    } else {
      this.handleLeave(() => window.location.href = '/');
    }
  };

  render() {
    return <Col xs={24}>
      <Card
        style={cardShadow}
        actions={[<Icon type="delete" onClick={this.cancel}/>,
          <Icon type="check" onClick={() => this.submit()}/>]}
      >

        <h1>{this.state.uuid ? 'Edit Recipe' : 'Add a New Recipe'}</h1>
        <br/>
        <p>Title:</p>
        <Input placeholder="Title" defaultValue={this.props.title} onChange={e => this.update('title', e)}/>
        <br/>
        <br/>
        <p>Description:</p>
        <TextArea placeholder="Description" defaultValue={this.props.description}
                  onChange={e => this.update('description', e)}
                  autosize={{minRows: 1}}/>
        <br/>
        <br/>
        <p>Ingredients:</p>
        <TextArea placeholder="Ingredients"
                  defaultValue={Object.keys(this.props.ingredientCategories || {}).map(k => ((k ? '=== ' + k + ' ===\n' : '') + this.props.ingredientCategories[k].join('\n'))).join('\n\n')}
                  onChange={e => this.setState({ingredientCategories: this.parseIngredientGroups(e.target.value)})}
                  autosize={{minRows: 3}}/>
        <br/>
        <br/>
        <p>Directions:</p>
        <TextArea placeholder="Directions"
                  defaultValue={this.props.directions}
                  onChange={e => this.update('directions', e)}
                  autosize={{minRows: 3,}}/>
        <br/>
        <br/>
        <p>Notes:</p>
        <Input placeholder="Notes" defaultValue={this.props.notes} onChange={e => this.update('notes', e)}/>
        <br/>
        <br/>
        <p>Tags:</p>
        <Input placeholder='Space separated ie. "dinner simple chicken crockpot"'
               defaultValue={(this.props.tags || []).join(' ')}
               onChange={e => this.setState({tags: e.target.value.trim().split(' ').filter(x => x.length !== 0)})}/>
      </Card>
    </Col>;
  }
}

const EditCard = withRouter(_EditCard);

class AddRecipePage extends Component {
  render() {
    return <Row type='flex' justify='center'>
      <EditCard/>
    </Row>;
  }
}

class EditRecipePage extends Component {
  state = {recipe: undefined};

  componentDidMount() {
    fetch(server + '/recipes/' + this.props.match.params.recipeUuid, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(r => r.json()).then(r => this.setState({recipe: r}));
  }

  render() {
    return <Row type='flex' justify='center'>
      {this.state.recipe ? <EditCard {...this.state.recipe}/> : <></>}
    </Row>;
  }
}

class ViewRecipePage extends Component {
  state = {recipe: undefined};

  componentDidMount() {
    fetch(server + '/recipes/' + this.props.match.params.recipeUuid, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(r => r.json()).then(r => this.setState({recipe: r}))
  }

  render() {
    return this.state.recipe ? <PageRenderer {...this.state.recipe}/> : <></>;
  }
}

class _RecipeCard extends Component {
  render() {
    const {history} = this.props;
    return <Col xs={24} sm={12} md={12} lg={8} xl={8}>
      <Card style={{...cardShadow, height: '100%'}}
            title={this.props.title[0].toUpperCase() + this.props.title.substr(1)}
            extra={shownTags.filter(x => this.props.tags.includes(x)).map(
              tag => <Link to={'/tag/' + tag} onClick={e => e.stopPropagation()} key={tag}><Tag>{tag}</Tag></Link>
            )}
            onClick={() => history.push('/view/' + this.props.uuid)}
            hoverable
      >
        <p>{this.props.description}</p>
      </Card>
    </Col>;
  }
}

function filterSeries(values, filters) {
  let outputs = new Set();
  for (let i = 0; i < filters.length; ++i) {
    for (let j = 0; j < values.length; ++j) {
      if (filters[i](values[j])) {
        outputs.add(values[j]);
      }
    }
  }
  return outputs;
}

function setInt(a, b) {
  return new Set([...a].filter(x => b.has(x)));
}

const RecipeCard = withRouter(_RecipeCard);

class MainPageRenderer extends Component {
  props = {tag: undefined};
  state = {searchBar: '', shownRecipes: [], errorText: '', recipes: []};

  setSearchBar = (text, recipes = undefined) => {
    const tags = [];
    const words = [];
    const tokens = text.split(' ').filter(Boolean);
    const allTags = new Set();
    const unknownTags = [];
    const state = {searchBar: text};
    if (this.props.tag !== undefined) {
      tags.push(this.props.tag);
    }
    if (recipes === undefined) {
      recipes = this.state.recipes;
    } else {
      state.recipes = recipes;
    }
    for (let i = 0; i < recipes.length; ++i) {
      const rTags = recipes[i].tags;
      for (let j = 0; j < rTags.length; ++j) {
        allTags.add(rTags[j]);
      }
    }
    let invalidAttributes = [];
    for (let i = 0; i < tokens.length; ++i) {
      let token = tokens[i];
      if (token.startsWith('-')) {
        token = token.substr('-'.length);
        if (!token.includes(':')) {  // In middle of typing filter
          continue;
        }
      }
      if (token.includes(':')) {
        const [attr, value] = token.split(':');
        if (attr !== 'tag') {
          invalidAttributes.push(attr);
          continue;
        }
        if (value === '') {
          continue;
        }
        if (allTags.has(value)) {
          tags.push(value);
        } else {
          unknownTags.push(value);
        }
      } else {
        words.push(token);
      }
    }
    const errors = [];
    if (invalidAttributes.length !== 0) {
      errors.push('Unknown search fields: ' + invalidAttributes.join(', '));
    }
    if (unknownTags.length !== 0) {
      errors.push('Tags not found: ' + unknownTags.join(', '));
    }
    state.errorText = errors.join(', ');
    text = words.join(' ').toLowerCase();
    if (text === '' && tags.length === 0) {
      state.shownRecipes = recipes;
    } else {
      const textFiltered = text.length === 0 ? new Set(recipes) : filterSeries(recipes, [
        x => x.title.toLowerCase().includes(text),
        x => x.description.toLowerCase().includes(text),
        x => x.directions.toLowerCase().includes(text),
      ]);
      const tagsFiltered = tags.length === 0 ? new Set(recipes) : filterSeries(recipes, tags.map(
        tag => x => x.tags.includes(tag)
      ));
      state.shownRecipes = [...setInt(textFiltered, tagsFiltered)];
    }
    this.setState(state);
  };

  componentDidMount() {
    fetch(server + '/recipes', {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(r => r.json()).then(recipes => this.setSearchBar('', recipes));
  }

  render() {
    return <div>
      <Link to='/'><h1>Gluten Free Cooking</h1></Link>
      <p>Welcome to the GF Cooking homepage</p>
      <Form prefixCls={undefined}>
        <Form.Item
          validateStatus={this.state.errorText.length === 0 ? 'success' : 'error'}
          help={this.state.errorText}
        >
          <Search
            placeholder="Search recipes..."
            onChange={e => this.setSearchBar(e.target.value)}
            value={this.state.searchBar}
            style={{width: 200}}
          />
        </Form.Item>
      </Form>
      <Row gutter={[20, 20]} type='flex'>
        {this.state.shownRecipes.map(fn => {
          return <RecipeCard key={fn.uuid} {...fn}/>;
        })}
      </Row>
    </div>
  }
}


class App extends Component {
  render() {
    return (
      <Layout className="layout">
        <Header>
          <div className="logo"/>
          <Menu
            theme="dark"
            mode="horizontal"
            defaultSelectedKeys={['1']}
            style={{lineHeight: '64px'}}
          >
            <Menu.Item key="1" active><a href="/#">Home</a></Menu.Item>
            <Menu.Item key="2" active><Link to='/add'>New Recipe</Link></Menu.Item>
          </Menu>
        </Header>
        <div className='site-header-padder'/>
        <Content className='site-content'>
          <div style={{background: '#fff', padding: 24, minHeight: 280, height: '100%'}}>
            <Switch>
              <Route exact path='/add' component={AddRecipePage}/>
              <Route exact path='/edit/:recipeUuid' component={EditRecipePage}/>
              <Route exact path='/' component={() => <MainPageRenderer/>}/>
              <Route exact path='/tag/:tag' component={props => <MainPageRenderer tag={props.match.params.tag}/>}/>
              <Route exact path='/view/:recipeUuid' component={ViewRecipePage}/>
            </Switch>
          </div>
        </Content>
        <div className='site-footer-padder'/>
        <Footer style={{textAlign: 'center'}}>
          Copyright © 2019 Scholefield
        </Footer>
      </Layout>
    );
  }
}

export default withRouter(App);
